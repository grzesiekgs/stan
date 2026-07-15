import { AtomOnUnobserve, GettableAtom, OnObserveStoreApi } from '../types';
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
        setSelf: (update) => storeApi.setAtom(atom, update),
      },
      atomValue
    );
  }

  if (isDerivedAtom(atom)) {
    return atom.onObserve({ peek: storeApi.peekAtom }, atomValue);
  }

  if (isObserverAtom(atom)) {
    // observerAtom has void as value, which is too strict out there.
    return atom.onObserve({ peek: storeApi.peekAtom }) as void | AtomOnUnobserve<Value>;
  }

  throw new Error('Atom is not gettable');
}
