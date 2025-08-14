import { createDerivedAtom } from '../atom/createAtom';
import { isDerivedAtom, isMutableAtom, isWritableAtom } from '../atom/utils';
import {
  AtomToStateMap,
  DerivedAtom,
  ReadableAtom,
  Store,
  ScheduleWriteAtomValue,
  ReadAtomValue,
  WriteAtomValue,
  AtomStateStatus,
} from '../types';
import { createMicrotaskQueue } from './microtaskQueue';
import {
  addAtomDependency,
  addAtomDeriver,
  getAtomStateFromStateMap,
  removeAtomDeriver,
} from './utils';

export const createStore = (): Store => {
  const atomToStateMap: AtomToStateMap = new WeakMap();
  (window as any).showState = () => console.log(atomToStateMap);

  const recalculateDeriversQueue = createMicrotaskQueue<DerivedAtom<any, any, any>>(
    (deriversToRecalculate) => {
      if (!deriversToRecalculate.size) {
        console.warn('SANITY CHECK IS ACTUALLY NECESSARY??');
        return;
      }
      // WARNING: Turns out that order doesn't really matter due to fact that readAtomValue is now pre-warming atom dependencies.

      //const orderedDeriversToRecalculate: DerivedAtom<any, any, any>[] = [];
      // TODO This could be optimized, because right now set has to be sorted and then array has to be iterated over.
      const start = performance.now();
      // deriversToRecalculate.forEach((deriverAtom) => {
      //   const deriverAtomState = getAtomStateFromStateMap(deriverAtom, atomToStateMap);
      //   // Don't consider deriverAtom for recalculation if it's fresh.
      //   // E.g. it has been read in same cycle as it's dependencies.
      //   if (!deriverAtomState.isObserved || deriverAtomState.status === AtomStateStatus.FRESH) {
      //     return;
      //   }
      //   // Sort derivers in order of their dependencies. Deriver with no other derivers as dependencies, should be first.
      //   // Deriver which depends on other not-fresh deriver, should be next, and so on.
      //   // This order has to be maintained because derivers lower in list, could mark derivers higher in list as not fresh.
      //   const orderedDeriverOfDeriverIndex = orderedDeriversToRecalculate.findIndex(
      //     (orderedDeriver) => {
      //       return deriverAtomState.derivers?.has(orderedDeriver);
      //     }
      //   );

      //   if (orderedDeriverOfDeriverIndex > -1) {
      //     orderedDeriversToRecalculate.splice(orderedDeriverOfDeriverIndex, 0, deriverAtom);
      //     splice++;
      //   } else {
      //     push++;
      //     orderedDeriversToRecalculate.push(deriverAtom);
      //   }
      // });
      // console.log('SORTING', performance.now() - start, splice, push);
      deriversToRecalculate.forEach((deriverAtom) => {
        const deriverAtomState = getAtomStateFromStateMap(deriverAtom, atomToStateMap);

        if (deriverAtomState.isObserved) {
          readAtomValue(deriverAtom);
        }
      });

      console.log('RECALCULATED', performance.now() - start);
    }
  );
  const unobserveAtomQueue = createMicrotaskQueue<ReadableAtom<any, any>>(
    async (atomsToUnobserve) => {
      await recalculateDeriversQueue.microtaskPromise;

      const possiblyUnobserveAtom = (atom: ReadableAtom<any, any>) => {
        const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
        const hasObservedDerivers = Array.from(atomState.derivers ?? []).some(
          (deriverAtom) => getAtomStateFromStateMap(deriverAtom, atomToStateMap).isObserved
        );

        if (hasObservedDerivers) {
          return;
        }
        console.log('UNOBSERVE', atom.storeLabel, atomState.derivers);
        atomState.onUnobserve?.();
        atomState.isObserved = false;
        atomState.dependencies?.forEach(possiblyUnobserveAtom);
      };

      atomsToUnobserve.forEach(possiblyUnobserveAtom);
    }
  );

  const markDerivedAtomForRecalculation = (
    atom: DerivedAtom<any, any, any>,
    status: AtomStateStatus
  ) => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    // Atom A could be marked as stale, but could be also deriver of atom B which is being marked as stale,
    // and this could mark atom A as pending [look at end of this function].
    // Therefore make sure to not override stale status, to ensure that atom will be updated in recalculate phase.
    // This seems to apply only to derived atoms, therefore could be moved to derivedAtom.read (the IDEA for store modularization refactor).
    if (atomState.status !== AtomStateStatus.STALE) {
      atomState.status = status;
    }
    // Since atom is already in queue, it should mean that it's derivers are also already in queue.
    if (recalculateDeriversQueue.has(atom)) {
      // Check just to make sure that above statement is correct.
      // This is for debugging purposes, remove later.
      if (
        Array.from(atomState.derivers ?? []).some(
          (deriverAtom) => !recalculateDeriversQueue.has(deriverAtom)
        )
      ) {
        console.warn(
          'THIS SHOULD NOT HAPPEN! DERIVERS NOT CORRECTLY MARKED FOR RECALCULATION',
          atom.storeLabel
        );
      }

      return;
    }

    recalculateDeriversQueue.add(atom);

    atomState.derivers?.forEach((deriverAtom) =>
      markDerivedAtomForRecalculation(deriverAtom, AtomStateStatus.PENDING)
    );
  };

  const updateAtomValue = <Value>(atom: ReadableAtom<Value, any>, value: Value): void => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);

    atomState.status = AtomStateStatus.FRESH;
    // Skip update if value did not change.
    if (atomState.value === value) {
      return;
    }
    // Since atom value updated, then value of direct derivers is stale until it will be recalculated.
    atomState.derivers?.forEach((deriverAtom) =>
      markDerivedAtomForRecalculation(deriverAtom, AtomStateStatus.STALE)
    );
    // Set new value, and clear derivers since each atom value requires separate list of derivers.
    atomState.value = value;
    atomState.derivers = undefined;
  };

  const markAtomAsObserved = <Value, Update>(atom: ReadableAtom<Value>) => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);

    if (atomState.isObserved) {
      return;
    }

    atomState.dependencies?.forEach(markAtomAsObserved);
    atomState.isObserved = true;

    if (!atom.onObserve) {
      return;
    }
    // Atom that is not writable, doesn't have access to setSelf in onObserve.
    const onUnobserve = isWritableAtom<Value, Update>(atom)
      ? atom.onObserve({
          peek: storeApi.peekAtom,
          // Consider allowing to set any atom within onObserve.
          setSelf: (value: Value) => {
            // Not sure why do I need (value: Value) out there :/ setSelf seems to be correctly typed, but value is any.
            storeApi.setAtom(atom, value);
          },
        })
      : atom.onObserve({ peek: storeApi.peekAtom });

    if (onUnobserve) {
      atomState.onUnobserve = onUnobserve;
    }
  };

  const unlinkAtomPreviousDependencies = (
    atom: DerivedAtom<any, any, any>,
    previousDependencies?: Set<ReadableAtom<any, any>>,
    currentDependencies?: Set<ReadableAtom<any, any>>
  ) => {
    if (!previousDependencies) {
      return;
    }

    const dependenciesToUnobserve = currentDependencies
      ? previousDependencies.difference(currentDependencies)
      : previousDependencies;

    dependenciesToUnobserve.forEach((dependencyAtom: ReadableAtom<unknown>) => {
      const dependencyAtomState = getAtomStateFromStateMap(dependencyAtom, atomToStateMap);

      removeAtomDeriver(dependencyAtomState, atom);

      unobserveAtomQueue.add(dependencyAtom);
    });
  };

  const readAtomValue: ReadAtomValue = (atom, observe) => {
    const start = performance.now();
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    // When to mark atom as not observed??
    if (observe) {
      markAtomAsObserved(atom);
    }
    // When state is marked as fresh, theres was no update since last read, therefore return value.
    if (atomState.status === AtomStateStatus.FRESH) {
      return atomState.value;
    }
    // Safety check to satisfy TS, mutable atom is always frash.
    if (!isDerivedAtom(atom)) {
      throw new Error(
        'Somehow MutableAtom has been marked as not fresh! This shouldn`t be possible!'
      );
    }
    // If atom is pending, it means that it's dependencies could be stale, therefore read them to trigger recalculation.
    // It effectively means pre-warming dependencies.
    if (atomState.status === AtomStateStatus.PENDING) {
      atomState.dependencies?.forEach((dependencyAtom) => readAtomValue(dependencyAtom));
      // Calling readAtomValue for dependencies, could mark atom as stale,
      // but if atom is still pending, it means that dependencies didn't change,
      // therefore atom is actually fresh and shouldn't recalculate.
      if (performance.now() - start > 1) {
        console.log('PENDING', performance.now() - start);
      }
      if (atomState.status === AtomStateStatus.PENDING) {
        atomState.status = AtomStateStatus.FRESH;

        return atomState.value;
      }
    }
    // Save and clear dependencies before reading atom value,
    // then compare new dependencies with saved ones,
    // to determine atoms which possibly should be unobserved.
    const previousDependencies = atomState.dependencies;
    atomState.dependencies = undefined;

    const value = atom.read(
      {
        get: (sourceAtom) => {
          const sourceAtomValue = readAtomValue(sourceAtom, atomState.isObserved);
          const sourceAtomState = getAtomStateFromStateMap(sourceAtom, atomToStateMap);
          // Possibly use weak refs?
          addAtomDependency(atomState, sourceAtom);
          addAtomDeriver(sourceAtomState, atom);

          return sourceAtomValue;
        },
        peek: storeApi.peekAtom,
        // TODO Expose scheduleSet just for effect atom? (not introduced yet)
        scheduleSet,
      },
      atomState
    );

    unlinkAtomPreviousDependencies(atom, previousDependencies, atomState.dependencies);
    updateAtomValue(atom, value);

    return value;
  };

  const writeAtomValue: WriteAtomValue = (atom, update) => {
    const value = atom.write({ peek: storeApi.peekAtom, set: storeApi.setAtom }, update);

    if (isMutableAtom(atom)) {
      updateAtomValue(atom, value);
    }

    return value;
  };

  const scheduleSet: ScheduleWriteAtomValue = (atom, update) => {
    Promise.resolve().then(() => writeAtomValue(atom, update));
  };

  const storeApi: Store = {
    peekAtom: (atom) => readAtomValue(atom),
    setAtom: writeAtomValue,
    observeAtom(atom, listener) {
      const observerAtom = createDerivedAtom(
        ({ get }) => {
          const value = get(atom);

          listener(value);
        },
        undefined,
        {
          storeLabel: `observerOf[${atom.storeLabel}]`,
        }
      );
      // Pretend that observerAtom is observed by some entity, so it will recalculate on deps change.
      readAtomValue(observerAtom, true);

      return () => {
        unobserveAtomQueue.add(observerAtom);
        storeApi.resetAtom(observerAtom);
      };
    },
    resetAtom(atom) {
      console.log('RESET ATOM', atom.storeLabel);
      // TODO Consider checking is atom actually mounted. (what for??)
    },
  };

  return storeApi;
};
