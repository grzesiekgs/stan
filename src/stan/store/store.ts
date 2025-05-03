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
  AtomState,
} from '../types';
import { createGetAtomValue, getAtomStateFromStateMap, removeAtomsRelation } from './utils';

export const createStore = (): Store => {
  const atomToStateMap: AtomToStateMap = new WeakMap();
  (window as any).showState = () => console.log(atomToStateMap);

  const deriversToRecalculate: Set<DerivedAtom<any, any, any>> = new Set();

  const updatedAtoms: Set<ReadableAtom<any, any>> = new Set();
  let recalculatePromise: null | Promise<void> = null;
  const recalculateDerivers = () => {
    if (!updatedAtoms.size) {
      console.warn('No updated atoms??');
    }

    const deriversToRecalculate: Set<DerivedAtom<any, any, any>> = new Set();
    const orderedDeriversToRecalculate: DerivedAtom<any, any, any>[] = [];

    // TODO This could be optimized, because right now set has to be sorted and then array has to be iterated over.
    // Therefore this is O(n) + O(1).
    
    const start = performance.now();

    deriversToRecalculate.forEach((deriverAtom) => {
      const deriverAtomState = getAtomStateFromStateMap(deriverAtom, atomToStateMap);
      // Don't consider deriverAtom for recalculation if it's fresh.
      // E.g. it has been read in same cycle as it's dependencies.
      if (deriverAtomState.isFresh) {
        return;
      }
      // Sort derivers in order of their dependencies. Deriver with no other derivers as dependencies, should be first.
      // Deriver which depends on other not-fresh deriver, should be next, and so on.
      // This order has to be maintained because derivers lower in list, could mark derivers higher in list as not fresh.
      const orderedDeriverOfDeriverIndex = orderedDeriversToRecalculate.findIndex(
        (orderedDeriver) => deriverAtomState.derivers?.has(orderedDeriver)
      );

      if (orderedDeriverOfDeriverIndex > -1) {
        orderedDeriversToRecalculate.splice(orderedDeriverOfDeriverIndex, 0, deriverAtom);
      } else {
        orderedDeriversToRecalculate.push(deriverAtom);
      }
    });

    orderedDeriversToRecalculate.forEach((deriverAtom) => {
      const deriverAtomState = getAtomStateFromStateMap(deriverAtom, atomToStateMap);

      readAtomValue(deriverAtom, deriverAtomState.isObserved);
    });

    deriversToRecalculate.clear();
    recalculatePromise = null;
    console.log(performance.now() - start);
  };

  const markDerivedAtomForRecalculation = (
    atom: DerivedAtom<any, any, any>
  ) => {
    if (deriversToRecalculate.has(atom)) {
      return;
    }

    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    const derivers = atomState.derivers;

    atomState.isFresh = false;

    deriversToRecalculate.add(atom);

    if (!derivers?.size) {
      return;
    }

    derivers.forEach(markDerivedAtomForRecalculation);
  };

  

  const updateAtomValue = <Value>(atom: ReadableAtom<Value, any>, value: Value): void => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);

    atomState.isFresh = true;
    // Skip update if value did not change.
    if (atomState.value === value) {
      return;
    }

    atomState.value = value;

    if (!atomState.derivers?.size) {
      return;
    }
    
    atomState.derivers.forEach((derivedAtom) => {
      removeAtomsRelation(atom, derivedAtom, atomToStateMap);
      markDerivedAtomForRecalculation(derivedAtom);
    });
    

    atomState.derivers?.forEach(markDerivedAtomForRecalculation);

    recalculatePromise = recalculatePromise ?? Promise.resolve().then(recalculateDerivers);
  };

  const possiblyStartObservingAtom = <Value, Update>(atom: ReadableAtom<Value>) => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);

    if (atomState.isObserved) {
      return;
    }

    atomState.isObserved = true;
    // Mark dependencies as observed.
    atomState.dependencies?.forEach(possiblyStartObservingAtom);

    if (!atom.onObserve) {
      return;
    }

    // Atom that is not writable, doesn't have access to setSelf in onObserve.
    const onUnobserve = isWritableAtom<Value, Update>(atom)
      ? atom.onObserve({
          peek: storeApi.peekAtom,
          setSelf: (value: Value) => {
            // Not sure why do I need (value: Value) out there :/ setSelf seems to be correctly typed, but value is any.
            storeApi.setAtom(atom, value);
          },
        })
      : atom.onObserve({ peek: storeApi.peekAtom });
    // This if statement allows to avoid creating onUnobserve property in atom state. This is possibly micro-optimization.
    // It could help optimize atomState object by JS engine, but it's just theory, as atomState.value can be of any type.
    // Maybe it's actually worth doing it other way around, and assigning undefined when createAtomState is called.
    if (onUnobserve) {
      atomState.onUnobserve = onUnobserve;
    }
  };

  const possiblyStopObservingAtom = (atom: ReadableAtom<any, any>) => {
    return;
  };

  const readAtomValue: ReadAtomValue = (atom, isObserved) => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    // When to mark atom as not observed??
    if (isObserved) {
      possiblyStartObservingAtom(atom);
    }
    // When state is marked as fresh, theres was no update since last read, therefore return value.
    if (atomState.isFresh) {
      return atomState.value;
    }

    // Safety check to satisfy TS, mutable atom is always frash.
    if (!isDerivedAtom(atom)) {
      throw new Error(
        'Somehow MutableAtom has been marked as not fresh! This shouldn`t be possible!'
      );
    }

    // Create getter which will mark current atom as deriver of it's dependencies.
    const value = atom.read(
      {
        get: createGetAtomValue(atom, atomToStateMap, readAtomValue),
        peek: storeApi.peekAtom,
        scheduleSet,
      },
      atomState
    );

    updateAtomValue(atom, value);

    return value;
  };

  const writeAtomValue: WriteAtomValue = (atom, update) => {
    const value = atom.write({ peek: storeApi.peekAtom, set: storeApi.setAtom }, update);

    if (isMutableAtom(atom)) {
      console.log('writeAtomValue', atom, update, value);
      // Update value at the end, because it will clear atom derivers.
      updateAtomValue(atom, value);
    }

    return value;
  };

  const scheduleSet: ScheduleWriteAtomValue = (atom, update) => {
    Promise.resolve().then(() => writeAtomValue(atom, update));
  };

  const storeApi: Store = {
    peekAtom: (atom) => readAtomValue(atom, false),
    setAtom: writeAtomValue,
    observeAtom(atom, listener) {
      const observerAtom = createDerivedAtom(
        ({ get }) => {
          const value = get(atom);

          listener(value);

          return value;
        },
        undefined,
        {
          storeLabel: `observerOf[${atom.storeLabel}]`,
        }
      );
      console.log('OBSERVE', `${atom.storeLabel} || ${observerAtom.storeLabel}`);
      readAtomValue(observerAtom, true);
      // Pretend that observerAtom is observed by some entity, so it will recalculate on deps change.
      // getAtomStateFromStateMap(observerAtom, atomToStateMap).isObserved = true;
      return () => {
        console.log('UNOBSERVE', `${atom.storeLabel} || ${observerAtom.storeLabel}`);
        // TODO How to unobserve??? When to reset it?? Maybe reset isObserved and derivers on deriversUpdate???
        // getAtomStateFromStateMap(observerAtom, atomToStateMap).isObserved = false;

        possiblyStopObservingAtom(observerAtom);
        storeApi.resetAtom(observerAtom);
      };
    },
    resetAtom(atom) {
      // TODO Consider checking is atom actually mounted. (what for??)
    },
  };

  return storeApi;
};
