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
} from '../types';

export const createNewAtomState = <Value>(atom: ReadableAtom<Value>): AtomState<Value> => {
  if (isMutableAtom<Value, unknown>(atom)) {
    const mutableAtomState: MutableAtomState<Value> = {
      value: atom.initialValue,
      dependencies: undefined,
      derivers: undefined,
      isFresh: true,
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
    isFresh: false,
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

export const createGetAtomValue =
  (
    derivedAtom: DerivedAtom<any, any, any>,
    atomToStateMap: AtomToStateMap,
    readAtomValue: ReadAtomValue,
  ): GetAtomValue<any> =>
  (sourceAtom) => {
    const sourceAtomState = getAtomStateFromStateMap(sourceAtom, atomToStateMap);
    const derivedAtomState = getAtomStateFromStateMap(derivedAtom, atomToStateMap);
    // Read atom value before adding derivedAtom as deriver of sourceAtom.
    // When sourceAtom value updates, it marks all it's derivers as not fresh, and clears derivers set.
    // If other derivers of sourceAtom are currently observed, then they must be scheduled for recalculate and that recalculate is already in progress.
    // derivedAtom becames observed 
    const sourceAtomValue = readAtomValue(sourceAtom, derivedAtomState.isObserved);
    // NOTE This possibly leaks memory, because unmounted atom could be still tracking other atoms. (not sure??)
    // Dependencies set most likely needed to track isObserved status.
    // Any other problem there?
    addAtomDependency(derivedAtomState, sourceAtom);
    addAtomDeriver(sourceAtomState, derivedAtom);

    return sourceAtomValue;
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

export const addAtomDependency = (
  atomState: AtomState<any>,
  dependencyAtom: ReadableAtom<any, any>
): void => {
  if (!atomState.dependencies) {
    atomState.dependencies = new Set();
  }

  atomState.dependencies.add(dependencyAtom);
};
