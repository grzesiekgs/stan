import { isMutableAtom } from '../atom/guards';
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
  DerivedAtom,
  ObserverAtom,
} from '../types';

export const createNewAtomState = <Value, UpdateValue>(
  atom: GettableAtom<Value, UpdateValue>
): AtomState<Value> => {
  if (isMutableAtom(atom)) {
    const mutableAtomState: MutableAtomState<Value> = {
      value: atom.getInitialValue(),
      dependencies: undefined,
      dependents: undefined,
      status: AtomStateStatus.FRESH,
      isObserved: false,
      onUnobserve: undefined,
    };

    return mutableAtomState;
  }
  // Just to highlight that initialAtomState satisfies DerivedAtomState type.
  const initialAtomState: InitialDerivedAtomState<Value> = {
    value: EmptyAtomValueSymbol,
    dependencies: undefined,
    dependents: undefined,
    status: AtomStateStatus.STALE,
    isObserved: false,
    onUnobserve: undefined,
  };
  const derivedAtomState: DerivedAtomState<Value> = initialAtomState;

  return derivedAtomState;
};

export function getAtomStateFromStateMap(
  atom: ObserverAtom,
  atomToStateMap: AtomToStateMap
): DerivedAtomState<void>;
export function getAtomStateFromStateMap<Value, Update>(
  atom: MutableAtom<Value, Update>,
  atomToStateMap: AtomToStateMap
): MutableAtomState<Value>;
export function getAtomStateFromStateMap<Value, Update, UpdateResult>(
  atom: DerivedAtom<Value, Update, UpdateResult>,
  atomToStateMap: AtomToStateMap
): DerivedAtomState<Value>;
export function getAtomStateFromStateMap<Value, Update>(
  atom: GettableAtom<Value, Update>,
  atomToStateMap: AtomToStateMap
): AtomState<Value>;
export function getAtomStateFromStateMap<Value, Update>(
  atom: GettableAtom<Value, Update>,
  atomToStateMap: AtomToStateMap
): AtomState<Value> {
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