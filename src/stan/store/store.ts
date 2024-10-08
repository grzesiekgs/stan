import { createAtom } from '../atom/atom';
import { isMutableAtom } from '../atom/utils';
import {
  AtomState,
  AtomToStateMap,
  DerivedAtom,
  ReadAtomArgs,
  StatefulAtom,
  Store,
  StoreValueGetter,
  StoreValueSetter,
} from '../types';
import {
  addAtomDependency,
  createNewAtomState,
  createProxiedGet,
  getAtomStateFromStateMap,
} from './utils';

export const createStore = (): Store => {
  const atomToStateMap: AtomToStateMap = new WeakMap();
  (window as any).showState = () => console.log(atomToStateMap);
  const recalculateAtomDerivers = (atom: StatefulAtom<any>) => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    const derivers = atomState.derivers;
    console.log('>>> UPDATE', atom.label);
    if (!derivers?.size) {
      console.log('>>> SKIP UPDATE', atom.label);
      return;
    }

    derivers.forEach((deriverAtom) => {
      const deriverAtomState = getAtomStateFromStateMap(deriverAtom, atomToStateMap);
      // Don't update deriver atom if it's not observed by anything. It will recaluclate when observation will start.
      if (!deriverAtomState.isObserved || deriverAtomState.isFresh) {
        console.log(
          '>>> SKIP DERIVER',
          atom.label,
          deriverAtom.label,
          deriverAtomState.isFresh,
          deriverAtomState.value
        );
        return;
      }
      derivers.delete(deriverAtom);
      console.log('>>> UPDATE DERIVER', atom.label, deriverAtom.label);
      // Create getter which will mark current atom as deriver of it's dependencies.
      const value = get(deriverAtom);

      return updateAtomValue(deriverAtom, value);
    });
    console.log('>>> DONE UPDATE', atom.label);
    // Clear derivers list after all derivers update.
  };

  const updateAtomValue = <Value>(atom: StatefulAtom<Value>, value: Value): Value => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    console.log('++ MARK ATOM AS FRESH', atom.label, value);
    atomState.isFresh = true;

    if (atomState.value === value) {
      return value;
    }

    atomState.value = value;
    // Mark each deriver as not fresh.
    atomState.derivers?.forEach((deriverAtom) => {
      const deriverAtomState = getAtomStateFromStateMap(deriverAtom, atomToStateMap);
      console.log('-- MARK DERIVER AS NOT FRESH', atom.label, deriverAtom.label);
      deriverAtomState.isFresh = false;
    });

    console.log('UPDATED ATOM', atom.label, atomState.value, atomState);
    // If StatefulAtom has been updated - make sure to update all it's observed derivers.
    // TODO Most likely I want to create queue out there, instea
    Promise.resolve(atom).then(recalculateAtomDerivers);

    return value;
  };

  const get: StoreValueGetter = (atom) => {
    console.log('GET', atom.label);
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);

    atomState.isObserved = true;
    // When state is marked as fresh, theres was no update since last read, therefore return value.
    if (atomState.isFresh) {
      console.log('GET_FRESH', atom.label, atomState.value);
      return atomState.value;
    }
    // Safety check to satisfy TS, mutable atom is always frash.
    if (isMutableAtom(atom)) {
      throw new Error(
        'Somehow MutableAtom has been marked as not fresh! This shouldn`t be possible!'
      );
    }

    // Create getter which will mark current atom as deriver of it's dependencies.
    const value = atom.read({ get: createProxiedGet(atom, atomToStateMap, get), peek }, atomState);
    console.log('GET_READ', atom.label, value);

    return updateAtomValue(atom, value);
  };
  const peek: StoreValueGetter = (atom) => {
    console.log('PEEK', atom.label);
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    // When state is marked as fresh, theres no question asked, just return value.
    if (atomState.isFresh) {
      console.log('PEEK_FRESH', atom.label, atomState.value);
      return atomState.value;
    }

    if (isMutableAtom(atom)) {
      throw new Error(
        'Somehow MutableAtom has been marked as not fresh! This shouldn`t be possible!'
      );
    }

    // TODO Explain how `peek` is different from `get`.
    const value = atom.read({ get, peek }, atomState);
    console.log('PEEK_READ', atom.label, value);

    return updateAtomValue(atom, value);
  };
  const set: StoreValueSetter = (atom, update) => {
    const value = atom.write({ peek, set }, update);

    if (isMutableAtom(atom)) {
      updateAtomValue(atom, value);
    }

    return value;
  };

  const storeApi: Store = {
    peekAtom: get,
    setAtom: set,
    observeAtom(atom, listener) {
      const observerAtom = createAtom({
        label: `observerOf${atom.label}`,
        getter: ({ get }) => {
          console.log('OBSERVER GET', atom.label);
          listener(get(atom));
        },
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
      // TODO Consider checking is atom actually mounted.
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
