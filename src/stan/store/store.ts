import { createAtom } from "../atom/atom";
import { isMutableAtom } from "../atom/utils";
import {
  AtomState,
  AtomToStateMap,
  ReadableAtom,
  Store,
  StoreValueGetter,
  StoreValueSetter,
} from "../types";
import { createProxiedGetter, getAtomStateFromStateMap } from "./utils";

const createStore = (): Store => {
  const atomToStateMap: AtomToStateMap = new WeakMap();
  const recalculateAtomDerivers = (atomState: AtomState<unknown>) => {
    if (!atomState.derivers) {
      return;
    }

    atomState.derivers.forEach((deriverAtom) => {
      const deriverAtomState = getAtomStateFromStateMap(deriverAtom, atomToStateMap);
      // When deriver is not observed, simply mark it as not fresh
      if (!deriverAtomState.isObserved) {
        deriverAtomState.isFresh = false;

        return;
      }
      // Create getter which will mark current atom as deriver of it's dependencies.
      const value = deriverAtom.read({ get: createProxiedGetter(get, atomToStateMap, deriverAtom), peek });

      return updateAtomValue(deriverAtom, value);
    })
    // Clear derivers list after all derivers update.
    atomState.derivers = undefined;
  };
  const updateAtomValue = <Value>(atom: ReadableAtom<Value>, value: Value): Value => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);

    atomState.value = value;
    atomState.isFresh = true;
    
    Promise.resolve(atomState).then(recalculateAtomDerivers);
    
    return value;
  }
  
  const get: StoreValueGetter = (atom) => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    // When state is marked as fresh, theres no question asked, just return value.
    if (atomState.isFresh) {
      return atomState.value;
    }
    // Safety check to satisfy TS, mutable atom is always frash.
    if (isMutableAtom(atom)) {
      throw new Error('Somehow MutableAtom has been marked as not fresh! This shouldn`t be possible!');
    }
    // Create getter which will mark current atom as deriver of it's dependencies.
    const value = atom.read({ get: createProxiedGetter(get, atomToStateMap, atom), peek });

    return updateAtomValue(atom, value);
  };
  const peek: StoreValueGetter = (atom) => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    // When state is marked as fresh, theres no question asked, just return value.
    if (atomState.isFresh) {
      return atomState.value;
    }

    if (isMutableAtom(atom)) {
      throw new Error('Somehow MutableAtom has been marked as not fresh! This shouldn`t be possible!');
    }
    // Since peek does not observe value change, use default getter.
    const value = atom.read({ get, peek })

    atomState.value = value;
    atomState.isFresh = true;
    
    return value;
  };
  const set: StoreValueSetter = (atom, value) => {
    const result = atom.write({ peek, set }, value);
    // If MutableAtom has been updated - make sure to update it's derivers.
    if (isMutableAtom(atom)) {
      const atomState = getAtomStateFromStateMap(atom, atomToStateMap);

      Promise.resolve(atomState).then(recalculateAtomDerivers);
    }

    return result;
  }

  const storeApi: Store = {
    peekAtomValue: peek,
    setAtomValue: set,
    observeAtomValue(atom, listener) {
      const observerAtom = createAtom({
        getter: ({ get }) => listener(get(atom))
      });

      get(observerAtom);
      // Pretend that observerAtom is observed by some entity, so it will recalculate on deps change.
      getAtomStateFromStateMap(observerAtom, atomToStateMap).isObserved = true;

      return () => storeApi.resetAtomValue(observerAtom);
    },
    resetAtomValue(atom) {
      atomToStateMap.delete(atom);
    }
  };

  return storeApi;
};

const testStore = createStore();
// Mutable
const testMutableAtom1 = createAtom({
  initialValue: 5,
})
const setMutableAtomRes1 = testStore.setAtomValue(testMutableAtom1, 10);
const peekMutableAtomRes1 = testStore.peekAtomValue(testMutableAtom1);

// Mutable mapped
const testMutableAtom2 = createAtom({
  initialValue: 5,
  setter: (_, update: string) => Number(update)
})
const setMutableAtomRes2 = testStore.setAtomValue(testMutableAtom2, '10')
const peekMutableAtomRes2 = testStore.peekAtomValue(testMutableAtom2)
// Derived
const testDerivedAtom = createAtom({
  getter: ({ get}) => String(get(testMutableAtom1))
})

const setDeriverAtomRes = testStore.setAtomValue(testDerivedAtom, 10)
const peekDeriverAtomRes = testStore.peekAtomValue(testDerivedAtom)

// Callback
const testCallbackAtom = createAtom({
  setter: ({ set }, update: string) => {
    return set(testMutableAtom1, Number(update));
  }
})
const setCallbackAtomRes = testStore.setAtomValue(testCallbackAtom, '2')
const peekCallbackAtomRes = testStore.peekAtomValue(testCallbackAtom)
