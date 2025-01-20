import { createAtom } from '../atom/atom';
import { isMutableAtom } from '../atom/utils';
import {
  AtomToStateMap,
  DerivedAtom,
  StatefulAtom,
  Store,
  StoreValueGetter,
  StoreValueScheduledSetter,
  StoreValueSetter,
  WritableAtom,
} from '../types';
import { createProxiedGet, getAtomStateFromStateMap } from './utils';

export const createStore = (): Store => {
  const atomToStateMap: AtomToStateMap = new WeakMap();
  (window as any).showState = () => console.log(atomToStateMap);
  const deriversToRecalculate: Set<DerivedAtom<any>> = new Set();
  let recalculatePromise: null | Promise<void> = null;
  const recalculateDerivers = () => {
    if (!deriversToRecalculate.size) {
      console.warn('No derivers to recalc??');
    }
    // TODO This could possibly be optimized, because right now set has to be sorted and then array has to be iterated over.
    const orderedDeriversToRecalculate: DerivedAtom<any>[] = [];
    const start = performance.now();
    const start1 = Date.now();

    deriversToRecalculate.forEach((deriverAtom) => {
      const deriverAtomState = getAtomStateFromStateMap(deriverAtom, atomToStateMap);
      const orderedDeriverOfDeriverIndex = orderedDeriversToRecalculate.findIndex(
        (orderedDeriver) => deriverAtomState.derivers?.has(orderedDeriver)
      );

      if (orderedDeriverOfDeriverIndex > -1) {
        orderedDeriversToRecalculate.splice(orderedDeriverOfDeriverIndex, 0, deriverAtom);
      } else {
        orderedDeriversToRecalculate.push(deriverAtom);
      }
    });

    // NOTE 'get' might be triggered for unobsered or fresh atom. Not sure should just ignore it?
    orderedDeriversToRecalculate.forEach(get);

    deriversToRecalculate.clear();
    recalculatePromise = null;
    console.log(performance.now() - start, Date.now() - start1);
  };
  // Optimistically mark derivers for recalculation.
  // They will get recalculated only if marked as not fresh.
  // They could be marked during scueduled recalculate.
  const markAtomDeriversForRecalculation = (atom: StatefulAtom<any>) => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);

    if (atomState.derivers) {
      const derivers = atomState.derivers;
      // TODO Just debug, should not happen. Remove later if will not occur.
      if (!derivers.size) {
        console.warn('No derivers to recalculate!', atom.label);
      }
      // Mark atom and it's derivers for recalculation.
      // Ignore order as it will be tahen care of in recalculateDerivers.
      derivers.forEach((deriverAtom) => {
        deriversToRecalculate.add(deriverAtom);

        markAtomDeriversForRecalculation(deriverAtom);
      });
      // OUTDATED
      // Add each deriver to recalculation set, and then recure call this function for each of derivers.
      // TODO There might be needed some more advanced thing.
      // Use two separate forEach calls, in order to prioritize update of currently processed derivers,
      // as they are deeper in derivers tree.
      // TODO Could use Set.intersection but it's quite fresh addition to ES, use it anyway?
      // derivers.forEach((deriverAtom) => deriversToRecalculate.add(deriverAtom));
      //derivers.forEach(markAtomDeriversForRecalculation);
    }
  };

  const scheduleRecalculateAtomDerivers = () => {
    recalculatePromise = recalculatePromise ?? Promise.resolve().then(recalculateDerivers);
  };
  // TODO Whats the point of returning value there? Combine it with 'read' or split.
  const updateAtomValue = <Value>(atom: StatefulAtom<Value>, value: Value): Value => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    atomState.isFresh = true;
    // Skip update if value did not change.
    if (atomState.value === value) {
      return value;
    }

    atomState.value = value;
    // If StatefulAtom has been updated - make sure to update all it's observed derivers.
    if (atomState.derivers) {
      // Mark direct derivers as not fresh. They will need to recalculate efectivelly calling this function, and marking their derivers as not fresh.
      atomState.derivers.forEach((deriverAtom) => {
        const deriverAtomState = getAtomStateFromStateMap(deriverAtom, atomToStateMap);

        deriverAtomState.isFresh = false;
      });
      atomState.derivers = undefined;
    }

    return value;
  };
  // TODO Unify get with peek? How to deal with isObserved?
  const get: StoreValueGetter = (atom) => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    // When to mark atom as not observed??
    atomState.isObserved = true;
    // When state is marked as fresh, theres was no update since last read, therefore return value.
    if (atomState.isFresh) {
      return atomState.value;
    }
    // Safety check to satisfy TS, mutable atom is always frash.
    if (isMutableAtom(atom)) {
      throw new Error(
        'Somehow MutableAtom has been marked as not fresh! This shouldn`t be possible!'
      );
    }
    // Create getter which will mark current atom as deriver of it's dependencies.
    const value = atom.read(
      { get: createProxiedGet(atom, atomToStateMap, get), peek, scheduleSet },
      atomState
    );

    return updateAtomValue(atom, value);
  };
  const peek: StoreValueGetter = (atom) => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    // When state is marked as fresh, theres no question asked, just return value.
    if (atomState.isFresh) {
      return atomState.value;
    }

    if (isMutableAtom(atom)) {
      throw new Error(
        'Somehow MutableAtom has been marked as not fresh! This shouldn`t be possible!'
      );
    }

    // TODO Explain how `peek` is different from `get`.
    const value = atom.read({ get, peek, scheduleSet }, atomState);

    return updateAtomValue(atom, value);
  };

  const set: StoreValueSetter = (atom, update) => {
    const value = atom.write({ peek, set }, update);

    if (isMutableAtom(atom)) {
      // NOTE Schedule recalculate before derivers are marked for recalculation.
      // Not 100% sure is this good idea.
      scheduleRecalculateAtomDerivers();
      markAtomDeriversForRecalculation(atom);
      // Update value at the end, because it will clear atom derivers.
      updateAtomValue(atom, value);
    }

    return value;
  };

  let scheduledSetPromise: null | Promise<void> = null;
  let scheduledSetJobs: null | Set<[WritableAtom<any, any>, any]> ();
  const scheduleSet: StoreValueScheduledSetter = (atom, update) => {

  };

  const storeApi: Store = {
    peekAtom: peek,
    setAtom: set,
    observeAtom(atom, listener) {
      const observerAtom = createAtom({
        label: `observerOf${atom.label}`,
        getter: ({ get }) => listener(get(atom)),
      });
      get(observerAtom);
      // Pretend that observerAtom is observed by some entity, so it will recalculate on deps change.
      // getAtomStateFromStateMap(observerAtom, atomToStateMap).isObserved = true;

      return () => {
        // TODO How to unobserve??? When to reset it?? Maybe reset isObserved and derivers on deriversUpdate???
        getAtomStateFromStateMap(observerAtom, atomToStateMap).isObserved = false;
        storeApi.resetAtom(observerAtom);
      };
    },
    resetAtom(atom) {
      // TODO Consider checking is atom actually mounted. (what for??)
    },
  };

  return storeApi;
};

/* 
// Mutable
const testMutableAtom1 = createAtom({
  initialValue: 5,
});
const setMutableAtomRes1 = testStore.setAtom(testMutableAtom1, 10);
const peekMutableAtomRes1 = testStore.peekAtom(testMutableAtom1);

// Mutable mapped
const testMutableAtom2 = createAtom({
  initialValue: 5,
  setter: (_, update: string) => Number(update),
});
const setMutableAtomRes2 = testStore.setAtom(testMutableAtom2, '10');
const peekMutableAtomRes2 = testStore.peekAtom(testMutableAtom2);
// Derived
const testDerivedAtom = createAtom({
  getter: ({ get }) => String(get(testMutableAtom1)),
});

const setDeriverAtomRes = testStore.setAtom(testDerivedAtom, 10);
const peekDeriverAtomRes = testStore.peekAtom(testDerivedAtom);

// Callback
const testCallbackAtom = createAtom({
  setter: ({ set }, update: string) => {
    return set(testMutableAtom1, Number(update));
  },
});
const setCallbackAtomRes = testStore.setAtom(testCallbackAtom, '2');
const peekCallbackAtomRes = testStore.peekAtom(testCallbackAtom);
*/
