import { createObserverAtom } from '../atom/createAtom';
import { isDependentAtom, isMutableAtom, isWritableAtom } from '../atom/utils';
import {
  AtomToStateMap,
  DerivedAtom,
  ReadableAtom,
  Store,
  ScheduleWriteAtomValue,
  ReadAtomValue,
  WriteAtomValue,
  AtomStateStatus,
  DependentAtom,
} from '../types';
import { createMicrotaskQueue } from './microtaskQueue';
import {
  addAtomDependency,
  addAtomDependent,
  getAtomStateFromStateMap,
  removeAtomDependent,
} from './utils';

export const createStore = (): Store => {
  const atomToStateMap: AtomToStateMap = new WeakMap();
  (window as any).showState = () => console.log(atomToStateMap);

  const recalculateDependentsQueue = createMicrotaskQueue<DerivedAtom<any, any, any>>(
    (dependentsToRecalculate) => {
      if (!dependentsToRecalculate.size) {
        console.warn('SANITY CHECK IS ACTUALLY NECESSARY??');
        return;
      }
      // WARNING: Turns out that order doesn't really matter due to fact that readAtomValue is now pre-warming atom dependencies.

      //const orderedDependentsToRecalculate: DerivedAtom<any, any, any>[] = [];
      // TODO This could be optimized, because right now set has to be sorted and then array has to be iterated over.
      const start = performance.now();
      // dependentsToRecalculate.forEach((deriverAtom) => {
      //   const deriverAtomState = getAtomStateFromStateMap(deriverAtom, atomToStateMap);
      //   // Don't consider deriverAtom for recalculation if it's fresh.
      //   // E.g. it has been read in same cycle as it's dependencies.
      //   if (!deriverAtomState.isObserved || deriverAtomState.status === AtomStateStatus.FRESH) {
      //     return;
      //   }
      //   // Sort dependents in order of their dependencies. Deriver with no other dependents as dependencies, should be first.
      //   // Deriver which depends on other not-fresh deriver, should be next, and so on.
      //   // This order has to be maintained because dependents lower in list, could mark dependents higher in list as not fresh.
      //   const orderedDeriverOfDeriverIndex = orderedDependentsToRecalculate.findIndex(
      //     (orderedDeriver) => {
      //       return deriverAtomState.dependents?.has(orderedDeriver);
      //     }
      //   );

      //   if (orderedDeriverOfDeriverIndex > -1) {
      //     orderedDependentsToRecalculate.splice(orderedDeriverOfDeriverIndex, 0, deriverAtom);
      //     splice++;
      //   } else {
      //     push++;
      //     orderedDependentsToRecalculate.push(deriverAtom);
      //   }
      // });
      // console.log('SORTING', performance.now() - start, splice, push);
      dependentsToRecalculate.forEach((deriverAtom) => {
        const deriverAtomState = getAtomStateFromStateMap(deriverAtom, atomToStateMap);

        if (deriverAtomState.isObserved) {
          readAtomValue(deriverAtom);
        }
      });

      console.log('RECALCULATED', performance.now() - start);
    }
  );
  const unobserveAtomQueue = createMicrotaskQueue<ReadableAtom<any>>(async (atomsToUnobserve) => {
    await recalculateDependentsQueue.microtaskPromise;

    const possiblyUnobserveAtom = (atom: ReadableAtom<unknown>) => {
      const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
      const hasObservedDependents = Array.from(atomState.dependents ?? []).some(
        (dependentAtom) => getAtomStateFromStateMap(dependentAtom, atomToStateMap).isObserved
      );
      // Atom is still observed by other atom.
      if (hasObservedDependents) {
        return;
      }
      console.log('UNOBSERVE atom', atom.storeLabel, atomState.dependents);
      atomState.onUnobserve?.();
      atomState.isObserved = false;
      atomState.dependencies?.forEach(possiblyUnobserveAtom);
    };

    atomsToUnobserve.forEach(possiblyUnobserveAtom);
  });

  const markDependentAtomForRecalculation = (
    atom: DependentAtom<unknown>,
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
    // Since atom is already in queue, it should mean that it's dependents are also already in queue.
    if (recalculateDependentsQueue.has(atom)) {
      // Check just to make sure that above statement is correct.
      // This is for debugging purposes, remove later.
      if (
        Array.from(atomState.dependents ?? []).some(
          (deriverAtom) => !recalculateDependentsQueue.has(deriverAtom)
        )
      ) {
        console.warn(
          'THIS SHOULD NOT HAPPEN! DEPENDENTS NOT CORRECTLY MARKED FOR RECALCULATION',
          atom.storeLabel
        );
      }

      return;
    }

    recalculateDependentsQueue.add(atom);

    atomState.dependents?.forEach((dependentAtom) =>
      markDependentAtomForRecalculation(dependentAtom, AtomStateStatus.PENDING)
    );
  };

  const updateAtomValue = <Value>(atom: ReadableAtom<Value>, value: Value): void => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);

    atomState.status = AtomStateStatus.FRESH;
    // Skip update if value did not change.
    if (atomState.value === value) {
      return;
    }
    // Since atom value updated, then value of direct dependents is stale until it will be recalculated.
    atomState.dependents?.forEach((dependentAtom) =>
      markDependentAtomForRecalculation(dependentAtom, AtomStateStatus.STALE)
    );
    // Set new value, and clear dependents since each atom value requires separate list of dependents.
    atomState.value = value;
    atomState.dependents = undefined;
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
          peek: storeApi.peekAtomValue,
          // Consider allowing to set any atom within onObserve.
          setSelf: (value: Value) => {
            // Not sure why do I need (value: Value) out there :/ setSelf seems to be correctly typed, but value is any.
            storeApi.setAtomValue(atom, value);
          },
        })
      : atom.onObserve({ peek: storeApi.peekAtomValue });

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

      removeAtomDependent(dependencyAtomState, atom);

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
    if (!isDependentAtom(atom)) {
      throw new Error(
        `Somehow MutableAtom has been marked as not fresh! This shouldn't be possible! - ${atom.storeLabel}`
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
        get: (dependencyAtom) => {
          const sourceAtomValue = readAtomValue(dependencyAtom, atomState.isObserved);
          const sourceAtomState = getAtomStateFromStateMap(dependencyAtom, atomToStateMap);
          // Note that subscription happens after sourceAtom has been updated in store.
          addAtomDependency(atomState, dependencyAtom);
          addAtomDependent(sourceAtomState, atom);

          return sourceAtomValue;
        },
        peek: storeApi.peekAtomValue,
        // TODO Expose scheduleSet just for observer atom? (not introduced yet)
        scheduleSet,
      },
      atomState
    );

    unlinkAtomPreviousDependencies(atom, previousDependencies, atomState.dependencies);
    updateAtomValue(atom, value);

    return value;
  };

  const writeAtomValue: WriteAtomValue = (atom, update) => {
    const value = atom.write({ peek: storeApi.peekAtomValue, set: storeApi.setAtomValue }, update);

    if (isMutableAtom(atom)) {
      updateAtomValue(atom, value);
    }

    return value;
  };

  const scheduleSet: ScheduleWriteAtomValue = (atom, update) => {
    Promise.resolve().then(() => writeAtomValue(atom, update));
  };

  const storeApi: Store = {
    peekAtomValue: (atom) => readAtomValue(atom),
    setAtomValue: writeAtomValue,
    getAtomState: (atom) => getAtomStateFromStateMap(atom, atomToStateMap),
    observeAtomValue(atom, listener) {
      // Create a wrapper observer which triggers the listener when atom value changes.
      const observerAtom = createObserverAtom(({ get }) => {
        const value = get(atom);

        listener(value);
      });
      // Pretent that wrapper observer is observed by some entity.
      readAtomValue(observerAtom, true);

      return () => {
        unobserveAtomQueue.add(observerAtom);
      };
    },
    resetAtomState(atom) {
      console.log('RESET ATOM', atom.storeLabel);
      // TODO Consider checking is atom actually mounted. (what for??)
    },
  };

  return storeApi;
};
