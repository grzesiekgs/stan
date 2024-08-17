import { isMutableAtom } from "../atom/utils";
import { AtomValueNotYetCalculatedSymbol } from "../symbols";
import { AtomState, AtomToStateMap, DerivedAtom, ReadableAtom, StoreValueGetter } from "../types";

const createNewAtomState = <Value>(atom: ReadableAtom<Value>): AtomState<Value> => ({
  // @ts-expect-error Not sure why tho. Check this later.
  value: isMutableAtom(atom) ? atom.initialValue : AtomValueNotYetCalculatedSymbol,
  dependencies: undefined,
  derivers: undefined,
  isFresh: true,
  isObserved: false,
});
  
export const getAtomStateFromStateMap = <Value>(
  atom: ReadableAtom<Value>,
  atomToStateMap: AtomToStateMap
): AtomState<Value> => {
  const atomState = atomToStateMap.get(atom);

  if (atomState) {
    return atomState;
  }
  
  const newAtomState = createNewAtomState(atom);
  atomToStateMap.set(atom, newAtomState);
  
  return newAtomState
};
// TODO Better name required.
export const createProxiedGetter = (defaultGet: StoreValueGetter, atomToStateMap: AtomToStateMap, deriverAtom: DerivedAtom<unknown>): StoreValueGetter => (dependencyAtom) => {
  const dependencyAtomState = getAtomStateFromStateMap(dependencyAtom, atomToStateMap);
  const deriverAtomState = getAtomStateFromStateMap(deriverAtom, atomToStateMap);

  if (!dependencyAtomState.derivers) {
    atomState.derivers = new Set();
  }
  dependencyAtomState.dependencys.add(deriverAtom);

  if (!deriverAtomState.dependencies) {
    deriverAtomState.dependencies = new Set();;
  }
  deriverAtomState.dependencies.add(dependencyAtom);

  return defaultGet(dependencyAtom);
}
