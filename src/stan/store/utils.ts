import { isMutableAtom } from '../atom/utils';
import { AtomValueNotYetCalculatedSymbol } from '../symbols';
import {
  GetAtomValue,
  AtomState,
  AtomToStateMap,
  DerivedAtom,
  DerivedAtomState,
  InitialAtomState,
  MutableAtomState,
  ReadableAtom,
  ReadAtomValue,
  AtomStateStatus,
} from '../types';

export const createNewAtomState = <Value>(atom: ReadableAtom<Value>): AtomState<Value> => {
  if (isMutableAtom<Value, unknown>(atom)) {
    const mutableAtomState: MutableAtomState<Value> = {
      value: atom.initialValue,
      dependencies: undefined,
      derivers: undefined,
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
    derivers: undefined,
    status: AtomStateStatus.STALE,
    isObserved: false,
    onUnobserve: undefined,
  };
  const derivedAtomState: DerivedAtomState<Value> = initialAtomState;

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

export const addAtomDeriver = (
  atomState: AtomState<any>,
  deriverAtom: DerivedAtom<any, any, any>
): void => {
  if (!atomState.derivers) {
    atomState.derivers = new Set();
  }

  atomState.derivers.add(deriverAtom);
};

export const removeAtomDeriver = (
  atomState: AtomState<any>,
  deriverAtom: DerivedAtom<any, any, any>
): void => {
  atomState.derivers?.delete(deriverAtom);

  if (atomState.derivers?.size) {
    return;
  }

  atomState.derivers = undefined;
};

export const addAtomDependency = (
  atomState: AtomState<any>,
  dependencyAtom: ReadableAtom<any, any>
): void => {
  if (!atomState.dependencies) {
    atomState.dependencies = new Set();
  }

  atomState.dependencies.add(dependencyAtom);
};

export const removeAtomDependency = (
  atomState: AtomState<any>,
  dependencyAtom: ReadableAtom<any, any>
): void => {
  atomState.dependencies?.delete(dependencyAtom);

  if (atomState.dependencies?.size) {
    return;
  }

  atomState.dependencies = undefined;
};
