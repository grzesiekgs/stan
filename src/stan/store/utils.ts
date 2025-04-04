import { isMutableAtom } from '../createAtom/utils';
import { AtomValueNotYetCalculatedSymbol } from '../symbols';
import {
  AtomState,
  AtomToStateMap,
  DerivedAtom,
  DerivedAtomState,
  InitialAtomState,
  MutableAtomState,
  ReadableAtom,
  StoreValueGetter,
} from '../types';

export const createNewAtomState = <Value>(atom: ReadableAtom<Value, unknown>): AtomState<Value> => {
  const initialAtomState: InitialAtomState = {
    value: AtomValueNotYetCalculatedSymbol,
    dependencies: undefined,
    derivers: undefined,
    isFresh: false,
    isObserved: false,
    isInitialized: false,
  };

  if (isMutableAtom<Value, unknown>(atom)) {
    const mutableAtomState: MutableAtomState<Value> = {
      value: atom.initialValue,
      dependencies: undefined,
      derivers: undefined,
      isFresh: true,
      isObserved: false,
      isInitialized: true,
    };

    return mutableAtomState;
  }
  // Just to highlight that initialAtomState satisfies DerivedAtomState type.
  const derivedAtomState: DerivedAtomState<Value> = initialAtomState;

  return derivedAtomState;
};

export const getAtomStateFromStateMap = <Value>(
  atom: ReadableAtom<Value, unknown>,
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

// TODO Better name required.
export const createDerivedAtomGetter =
  (
    derivedAtom: DerivedAtom<any, any, any>,
    atomToStateMap: AtomToStateMap,
    get: StoreValueGetter
  ): StoreValueGetter =>
  (atom) => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    const derivedAtomState = getAtomStateFromStateMap(derivedAtom, atomToStateMap);
    // Read atom before adding deriverAtom as deriver of atom.
    // When atom value updates, it marks all it's derivers as not fresh, and clears derivers set.
    // If other derivers of atom are currently observed, then they must be scheduled for recalculate and that recalculate is already in progress.
    const atomValue = get(atom);
    // NOTE This possibly leaks memory, because unmounted atom could be still tracking other atoms.
    // Althout dependencies set is needed to (or rather planned) onl track isObserved status, so reference can be cleared.
    // Any other problem there?
    addAtomDependency(derivedAtomState, atom);
    addAtomDeriver(atomState, derivedAtom);

    return atomValue;
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
