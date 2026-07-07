import { isMutableAtom } from '../atom/utils';
import { EmptyAtomValueSymbol } from '../symbols';
import {
  AtomState,
  DerivedAtomState,
  InitialDerivedAtomState,
  MutableAtom,
  MutableAtomState,
  GettableAtom,
  AtomStateStatus,
  DependentAtom,
  DependencyAtom,
  AtomReadCycle,
  AtomToStateMap,
} from '../types';

export const createNewAtomState = (atom: GettableAtom): AtomState<any> => {
  if (isMutableAtom(atom)) {
    const mutableAtomState: MutableAtomState<any> = {
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
  const initialAtomState: InitialDerivedAtomState<unknown> = {
    value: EmptyAtomValueSymbol,
    dependencies: undefined,
    dependents: undefined,
    status: AtomStateStatus.STALE,
    isObserved: false,
    onUnobserve: undefined,
  };
  const derivedAtomState: DerivedAtomState<unknown> = initialAtomState;

  return derivedAtomState;
};

export function getAtomStateFromStateMap<Value, Update>(
  atom: MutableAtom<Value, Update>,
  atomToStateMap: AtomToStateMap
): MutableAtomState<Value>;
export function getAtomStateFromStateMap(
  atom: GettableAtom,
  atomToStateMap: AtomToStateMap
): AtomState<any>;
export function getAtomStateFromStateMap(
  atom: GettableAtom,
  atomToStateMap: AtomToStateMap
): AtomState<any> {
  const atomState = atomToStateMap.get(atom);

  if (atomState) {
    return atomState;
  }

  const newAtomState = createNewAtomState(atom);
  atomToStateMap.set(atom, newAtomState);

  return newAtomState;
}
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
  dependencyAtom: DependencyAtom<any>
): void => {
  if (!atomState.dependencies) {
    atomState.dependencies = new Set();
  }

  atomState.dependencies.add(dependencyAtom);
};
// Possibly use weak refs?
export const removeAtomDependency = (
  atomState: AtomState<any>,
  dependencyAtom: DependencyAtom<any>
): void => {
  atomState.dependencies?.delete(dependencyAtom);

  if (atomState.dependencies?.size) {
    return;
  }

  atomState.dependencies = undefined;
};

export const getDependenciesToUnobserve = (
  previousDependencies?: Set<DependencyAtom<any>>,
  currentDependencies?: Set<DependentAtom<any>>
): Set<DependencyAtom<any>> | undefined => {
  if (!previousDependencies) {
    return undefined;
  }

  if (!currentDependencies) {
    return previousDependencies;
  }

  return previousDependencies.difference(currentDependencies);
};

export const createAtomReadCycle = (
  observed: boolean,
  preExistingChain?: AtomReadCycle['chain']
): AtomReadCycle => {
  const chain = new Set<GettableAtom>(preExistingChain);

  return {
    id: performance.now(),
    chain,
    observed,
  };
};