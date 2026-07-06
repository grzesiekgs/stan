import { createObserverAtom } from '../atom/createAtom';
import { isDependentAtom, isMutableAtom, isWritableAtom } from '../atom/utils';
import { NoOnObserveInitialValueSymbol, NoOnObserveInitialValueSymbolType } from '../symbols';
import {
  AtomToStateMap,
  ReadableAtom,
  Store,
  ScheduleWriteAtomValue,
  ReadAtomValue,
  WriteAtomValue,
  AtomStateStatus,
  DependentAtom,
  DependencyAtom,
} from '../types';
import { createMicrotaskQueue } from './microtaskQueue';
import {
  addAtomDependency,
  addAtomDependent,
  createAtomReadCycle,
  getAtomStateFromStateMap,
  getDependenciesToUnobserve,
  removeAtomDependent,
} from './utils';

export const createStore = (): Store => {
  const atomToStateMap: AtomToStateMap = new WeakMap();
  (window as any).showState = () => console.log(atomToStateMap);

  const recalculateDependentsQueue = createMicrotaskQueue<DependentAtom<any>>(
    (dependentsToRecalculate) => {
      if (!dependentsToRecalculate.size) {
        console.warn('SANITY CHECK IS ACTUALLY NECESSARY??');
        return;
      }

      const alreadyProcessed = new Set<DependentAtom<any>>();

      dependentsToRecalculate.forEach((deriverAtom) => {
        if (alreadyProcessed.has(deriverAtom)) {
          console.warn('REPROCESSING DERIVER', deriverAtom.storeLabel);
        }

        const deriverAtomState = getAtomStateFromStateMap(deriverAtom, atomToStateMap);

        if (deriverAtomState.isObserved) {
          readAtomValue(deriverAtom, createAtomReadCycle(false));
        }

        alreadyProcessed.add(deriverAtom);
      });
    }
  );
  (globalThis as any).mcQueue = recalculateDependentsQueue;
  const possiblyUnobserveAtom = (atom: ReadableAtom<any>) => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    const hasObservedDependents = Array.from(atomState.dependents ?? []).some(
      (dependentAtom) => getAtomStateFromStateMap(dependentAtom as any, atomToStateMap).isObserved
    );
    // Atom is still observed by other atom.
    if (hasObservedDependents) {
      return;
    }

    atomState.onUnobserve?.();
    atomState.isObserved = false;
    atomState.dependencies?.forEach(possiblyUnobserveAtom);
  };
  const unobserveAtomQueue = createMicrotaskQueue<ReadableAtom<any>>(async (atomsToUnobserve) => {
    await recalculateDependentsQueue.getMicrotaskPromise();

    atomsToUnobserve.forEach(possiblyUnobserveAtom);
  });

  const markDependentAtomForRecalculation = (atom: DependentAtom<any>, status: AtomStateStatus) => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    // Atom A could be marked as stale, but could be also deriver of atom B which is being marked as stale,
    // and this could mark atom A as undetermined [look at end of this function].
    // Therefore make sure to not override undetermined status, to ensure that atom will be updated in recalculate phase.
    // This seems to apply only to derived atoms, therefore could be moved to derivedAtom.read (the IDEA for store modularization refactor).
    if (atomState.status !== AtomStateStatus.STALE) {
      atomState.status = status;
    }

    const added = recalculateDependentsQueue.pushItem(atom);
    // "added" is false when atom is already in queue.
    if (!added) {
      return;
    }

    // If atom did update, it's direct dependats are marked as stale, but it's uncertain does dependants of dependants actually have to update.
    atomState.dependents?.forEach((dependentAtom) =>
      markDependentAtomForRecalculation(dependentAtom, AtomStateStatus.UNDETERMINED)
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

  const markAtomAsObserved = <Value, Update>(
    atom: ReadableAtom<Value>
  ): Value | NoOnObserveInitialValueSymbolType => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    // Atom already observed.
    if (atomState.isObserved) {
      return NoOnObserveInitialValueSymbol;
    }
    // Mark dependencies as observed before marking given atom as observed.
    atomState.dependencies?.forEach(markAtomAsObserved);
    atomState.isObserved = true;

    if (!atom.onObserve) {
      return NoOnObserveInitialValueSymbol;
    }
    // Atom that is not writable, doesn't have access to setSelf in onObserve.
    const onObserveResult = isWritableAtom<Value, Update>(atom)
      ? atom.onObserve({
          peek: storeApi.peekAtomValue,
          // TODO Consider allowing to set any atom within onObserve.
          // What is the use case? To avoid wrapper atom pattern from jotai?

          // Not sure why do I need (value: Value) out there :/ setSelf seems to be correctly typed, but value is any.
          setSelf: (value: Value) => {
            storeApi.setAtomValue(atom, value);
          },
        })
      : atom.onObserve({ peek: storeApi.peekAtomValue });

    if (!onObserveResult) {
      return NoOnObserveInitialValueSymbol;
    }

    if (typeof onObserveResult === 'function') {
      atomState.onUnobserve = onObserveResult;

      return NoOnObserveInitialValueSymbol;
    }

    const { unsubscribe, value } = Object.assign(
      { value: NoOnObserveInitialValueSymbol },
      onObserveResult
    );

    atomState.onUnobserve = unsubscribe;

    return value;
  };

  const unlinkAtomPreviousDependencies = (
    atom: DependentAtom<any>,
    previousDependencies?: Set<DependencyAtom<any>>,
    currentDependencies?: Set<DependentAtom<any>>
  ) => {
    const dependenciesToUnobserve = getDependenciesToUnobserve(
      previousDependencies,
      currentDependencies
    );

    dependenciesToUnobserve?.forEach((dependencyAtom: ReadableAtom<any>) => {
      const dependencyAtomState = getAtomStateFromStateMap(dependencyAtom, atomToStateMap);

      removeAtomDependent(dependencyAtomState, atom);

      unobserveAtomQueue.pushItem(dependencyAtom);
    });
  };

  const readAtomValue: ReadAtomValue = (atom, readCycle) => {
    if (readCycle.chain.has(atom)) {
      throw new Error(`Cycle detected in read chain: ${atom.storeLabel}`);
    }

    readCycle.chain.add(atom);

    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);

    if (readCycle.observed) {
      const onOnbserveInitialValue = markAtomAsObserved(atom);

      if (onOnbserveInitialValue !== NoOnObserveInitialValueSymbol) {
        updateAtomValue(atom, onOnbserveInitialValue);

        return onOnbserveInitialValue;
      }
    }

    // When state is marked as fresh, theres was no update since last read, therefore return value.
    if (atomState.status === AtomStateStatus.FRESH) {
      return atomState.value;
    }

    // Sanity check. Only mutable atom is always fresh.
    if (!isDependentAtom(atom)) {
      throw new Error(
        `Somehow MutableAtom has been marked as not fresh! This shouldn't be possible! - ${atom.storeLabel}`
      );
    }
    // If atom updated, it's direct dependants are marked as STALE,
    // but dependants of dependants are marked as UNDETERMINED as we are actually not certain do we have to recalculate these.
    // Therefore traverse dependencies in search of STALE atom, if such atom will be found,
    // it will recalculate, and mark all of direct dependants as STALE. Process will repeat from bottom of dependency tree to this atom,
    // effectively marking atoms as STALE on the way.
    if (atomState.status === AtomStateStatus.UNDETERMINED) {
      // Don't reuse cycle for prewarming. Cycle will be reused few lines later, if it will be decided that atom hs to recalculate.
      atomState.dependencies?.forEach((dependencyAtom) =>
        readAtomValue(dependencyAtom, createAtomReadCycle(false))
      );
      // Since dependency tree was traversed, and atom is still UNDETERMINED (not STALE),
      // it means that atom didn't have to recalculate as result of updating dependency.
      if (atomState.status === AtomStateStatus.UNDETERMINED) {
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
          const sourceAtomValue = readAtomValue(
            dependencyAtom,
            createAtomReadCycle(readCycle.observed, readCycle.chain) // Create new read chain, using previous chain.
          );
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
      atomState.value
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
    peekAtomValue: (atom) => readAtomValue(atom, createAtomReadCycle(false)),
    setAtomValue: writeAtomValue,
    observeAtomValue(atom, listener) {
      // Create a wrapper observer which triggers the listener when atom value changes.
      const observerAtom = createObserverAtom(
        ({ get }) => {
          const value = get(atom);

          listener(value);
        },
        {
          storeLabel: `observer[${atom.storeLabel}]`,
        }
      );
      // Mark observer as observed, so it will keep receiving updates until unobserved.
      readAtomValue(observerAtom, createAtomReadCycle(true));

      return () => {
        unobserveAtomQueue.pushItem(observerAtom);
      };
    },
    resetAtomState(atom) {
      console.log('RESET ATOM', atom.storeLabel);
      // TODO Unmount -> reset in store -> mount if was previously mounted and restore derivers????
    },
    getAtomState: (atom) => getAtomStateFromStateMap(atom, atomToStateMap),
    peekAtomToStateMap: () => atomToStateMap,
  };

  return storeApi;
};
