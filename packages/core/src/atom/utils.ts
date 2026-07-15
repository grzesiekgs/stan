import { GettableAtom, AtomOnUnobserve, OnObserveStoreApi } from '../types';
import { isDerivedAtom, isMutableAtom, isObserverAtom } from './guards';

export function resolveAtomOnObserve<Value>(
  atom: GettableAtom<Value>,
  atomValue: Value,
  storeApi: OnObserveStoreApi
): void | AtomOnUnobserve<Value> {
  if (!atom.onObserve) {
    return;
  }

  if (isMutableAtom(atom)) {
    return atom.onObserve(
      {
        peek: storeApi.peekAtom,
        setSelf: (value) => storeApi.setAtom(atom, value),
      },
      atomValue
    );
  }

  if (isDerivedAtom(atom)) {
    return atom.onObserve({ peek: storeApi.peekAtom }, atomValue);
  }

  if (isObserverAtom(atom)) {
    return atom.onObserve({ peek: storeApi.peekAtom }, atomValue);
  }

  throw new Error('Atom is not gettable');
}
