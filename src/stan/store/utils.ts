import { isMutableAtom } from '../atom/utils';
import { AtomValueNotYetCalculatedSymbol } from '../symbols';
import {
  AtomState,
  AtomToStateMap,
  AtomValueGetter,
  AtomValueSetter,
  DerivedAtom,
  InitialDerivedAtomState,
  ReadAtom,
  StatefulAtom,
  StoreValueGetter,
  WritableAtom,
} from '../types';

export const createNewAtomState = <Value>(atom: StatefulAtom<Value>): AtomState<Value> => {
  if (isMutableAtom(atom)) {
    return {
      value: atom.initialValue,
      dependencies: undefined,
      derivers: undefined,
      isFresh: true,
      isObserved: false,
      isInitialized: true,
    };
  }

  return {
    value: AtomValueNotYetCalculatedSymbol,
    dependencies: undefined,
    derivers: undefined,
    isFresh: false,
    isObserved: false,
    isInitialized: false,
  };
};

export const getAtomStateFromStateMap = <Value>(
  atom: StatefulAtom<Value>,
  atomToStateMap: AtomToStateMap
): AtomState<Value> => {
  const atomState = atomToStateMap.get(atom);

  if (atomState) {
    return atomState;
  }

  const newAtomState = createNewAtomState(atom);
  atomToStateMap.set(atom, newAtomState);

  return newAtomState;
};

export const isAtomStateInStateMap = (atom: StatefulAtom<any>, atomToStateMap: AtomToStateMap) =>
  atomToStateMap.has(atom);
// TODO Better name required.
export const createProxiedGet =
  (
    derivedAtom: DerivedAtom<any>,
    atomToStateMap: AtomToStateMap,
    get: StoreValueGetter
  ): StoreValueGetter =>
  (atom) => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    const derivedAtomState = getAtomStateFromStateMap(derivedAtom, atomToStateMap);
    // NOTE This possibly leaks memory, because unmounted atom could be still tracking other atoms.
    addAtomDependency(derivedAtomState, atom);
    addAtomDeriver(atomState, derivedAtom);
    console.log(
      'PROXIED_GET',
      derivedAtom.label,
      atom.label,
      derivedAtomState.dependencies,
      atomState.derivers,
      atomState.dependencies
    );
    return get(atom);
  };

export const addAtomDeriver = (atomState: AtomState<any>, deriverAtom: StatefulAtom<any>): void => {
  if (!atomState.derivers) {
    atomState.derivers = new Set();
  }

  atomState.derivers.add(deriverAtom);
};

export const addAtomDependency = (
  atomState: AtomState<any>,
  dependencyAtom: StatefulAtom<any>
): void => {
  if (!atomState.dependencies) {
    atomState.dependencies = new Set();
  }

  atomState.dependencies.add(dependencyAtom);
};
