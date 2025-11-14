import { isMutableAtom } from '../atom/utils';
import { AtomValueNotYetCalculatedSymbol } from '../symbols';
import {
  AtomState,
  AtomToStateMap,
  DependentAtomState,
  InitialAtomState,
  MutableAtomState,
  ReadableAtom,
  AtomStateStatus,
  DependentAtom,
} from '../types';

export const createNewAtomState = <Value>(atom: ReadableAtom<Value>): AtomState<Value> => {
  if (isMutableAtom<Value, unknown>(atom)) {
    const mutableAtomState: MutableAtomState<Value> = {
      value: atom.initialValue,
      dependencies: undefined,
      dependents: undefined,
      status: AtomStateStatus.FRESH,
      isObserved: false,
      onUnobserve: undefined,
    };

    return mutableAtomState;
  }
  // Just to highlight that initialAtomState satisfies DerivedAtomState type.
  const initialAtomState: InitialAtomState = {
    value: AtomValueNotYetCalculatedSymbol,
    dependencies: undefined,
    dependents: undefined,
    status: AtomStateStatus.STALE,
    isObserved: false,
    onUnobserve: undefined,
  };
  const derivedAtomState: DependentAtomState<Value> = initialAtomState;

  return derivedAtomState;
};

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

  return newAtomState;
};
// Possibly use weak refs?
export const addAtomDependent = (
  atomState: AtomState<any>,
  dependentAtom: DependentAtom<any>
): void => {
  if (!atomState.dependents) {
    atomState.dependents = new Set();
  }

  atomState.dependents.add(dependentAtom);
};
// Possibly use weak refs?
export const removeAtomDependent = (
  atomState: AtomState<any>,
  dependentAtom: DependentAtom<any>
): void => {
  atomState.dependents?.delete(dependentAtom);

  if (atomState.dependents?.size) {
    return;
  }

  atomState.dependents = undefined;
};
// Possibly use weak refs?
export const addAtomDependency = (
  atomState: AtomState<any>,
  dependencyAtom: ReadableAtom<any>
): void => {
  if (!atomState.dependencies) {
    atomState.dependencies = new Set();
  }

  atomState.dependencies.add(dependencyAtom);
};
// Possibly use weak refs?
export const removeAtomDependency = (
  atomState: AtomState<any>,
  dependencyAtom: ReadableAtom<any>
): void => {
  atomState.dependencies?.delete(dependencyAtom);

  if (atomState.dependencies?.size) {
    return;
  }

  atomState.dependencies = undefined;
};
