import {
  AtomToStateMap,
  Store,
  StoreValueGetter,
  WritableAtom,
} from "../types";
import { getAtomStateFromStateMap } from "./utils";

const createStore = (): Store => {
  const atomToStateMap: AtomToStateMap = new WeakMap();
  const get: StoreValueGetter = (atom) => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    // TODO subscribe logic there
    return atomState.value;
  };
  const peek: StoreValueGetter = (atom) => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);

    return atomState.value;
  };
  const storeApi: Store = {
    peekAtomValue: (atom) => {
      const atomState = atomToStateMap.get(atom);

      if (atomState) {
        return atomState;
      }

      const value = atom.read({ get, peek });
      atomToStateMap.set(atom, value);

      return value;
    },
    subscribeToAtomValue(atom, listener) {
      return () => {};
    },
    setAtomValue: <Value>(
      atom: WritableAtom<Value, Value>,
      value: Value
    ): Value => {
      atomToStateMap.set(atom, value);

      return value;
    },
  };

  return storeApi;
};
