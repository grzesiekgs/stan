import { AtomState, AtomToStateMap, DerivedAtom, MutableAtom, ReadableAtom } from "../types";


export const initializeMutableAtomState = <Value>(atom: MutableAtom<Value, unknown>): AtomState<Value> => ({
  deps: undefined,
  value: atom.initialValue
})

export const calculateDerivedAtomState = <Value>(atom: DerivedAtom<Value>): AtomState<Value> => {

}

export const calculateAtomState = <Value>(atom: ReadableAtom<Value>, atomToStateMap: AtomToStateMap): AtomState<Value> => {
    if (atom.read) {

    }

    
}

const createAtomState = <Value>(atom: ReadableAtom<Value>): AtomState<Value> => {
  const value = atom.initialValue === undefined ?   
  return {
  deps: new Set(),
  value,
}
};


  
export const getAtomStateFromStateMap = <Value>(
  atom: ReadableAtom<Value>,
  atomToStateMap: AtomToStateMap
): AtomState<Value> => {
  let atomState = atomToStateMap.get(atom);

  if (!atomState) {
    atomState = createAtomState();

    atomToStateMap.get(atom);
  }

  return atomState;
};
