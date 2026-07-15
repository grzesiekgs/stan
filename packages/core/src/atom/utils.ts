import { NoOnObserveInitialValueSymbol, NoOnObserveInitialValueSymbolType } from '../symbols';
import {
  AnyAtom,
  CallbackAtom,
  DependentAtom,
  DerivedAtom,
  MutableAtom,
  ObserverAtom,
  SettableAtom,
  SettableAtomDerivedValue,
  GettableAtom,
  SettableAtomType,
  AtomOnUnobserveResult,
  OnObserveStoreApi,
} from '../types';

type ResolveOnObserveAtomValue<A extends GettableAtom> =
  A extends MutableAtom<infer V, any>
    ? V
    : A extends DerivedAtom<infer V, any, any>
      ? V
      : A extends ObserverAtom
        ? void
        : A extends GettableAtom<infer V, any>
          ? V
          : never;

export type ResolveOnObserveReturn<A extends GettableAtom> =
  A extends MutableAtom<infer V>
    ? AtomOnUnobserveResult<V> | NoOnObserveInitialValueSymbolType
    : A extends DerivedAtom<infer V, any, any>
      ? AtomOnUnobserveResult<V> | NoOnObserveInitialValueSymbolType
      : A extends ObserverAtom
        ? AtomOnUnobserveResult<void> | NoOnObserveInitialValueSymbolType
        : never;

export const isMutableAtom = <Value, UpdateValue>(
  atom: AnyAtom | MutableAtom<Value, UpdateValue>
): atom is MutableAtom<Value, UpdateValue> => atom.type === 'mutable';

export const isDerivedAtom = <Value, UpdateValue, UpdateResult>(
  atom: AnyAtom | DerivedAtom<Value, UpdateValue, UpdateResult>
): atom is DerivedAtom<Value, UpdateValue, UpdateResult> => atom.type === 'derived';

export const isObserverAtom = (atom: AnyAtom | ObserverAtom): atom is ObserverAtom =>
  atom.type === 'observer';
// Can be removed if sanity check passes.
export const isDependentAtom = <Value>(
  atom: AnyAtom | DependentAtom<Value>
): atom is DependentAtom<Value> => isDerivedAtom(atom) || isObserverAtom(atom);

export const isCallbackAtom = <UpdateValue, UpdateResult>(
  atom: AnyAtom | CallbackAtom<UpdateValue, UpdateResult>
): atom is CallbackAtom<UpdateValue, UpdateResult> => atom.type === 'callback';

export const isGettableAtom = <Value>(
  atom: AnyAtom | GettableAtom<Value>
): atom is GettableAtom<Value> => 'read' in atom;

export const isSettableAtom = <
  UpdateValue,
  UpdateResult,
  AtomType extends SettableAtomType,
  DerivedValue extends SettableAtomDerivedValue<AtomType, UpdateResult> = SettableAtomDerivedValue<
    AtomType,
    UpdateResult
  >,
>(
  atom: AnyAtom | SettableAtom<UpdateValue, UpdateResult, AtomType, DerivedValue>
): atom is SettableAtom<UpdateValue, UpdateResult, AtomType, DerivedValue> =>
  'write' in atom || 'callback' in atom;

export function resolveAtomOnObserve<Atom extends GettableAtom>(
  atom: Atom,
  atomValue: ResolveOnObserveAtomValue<Atom>,
  storeApi: OnObserveStoreApi
): ResolveOnObserveReturn<Atom> {
  if (!atom.onObserve) {
    return NoOnObserveInitialValueSymbol as ResolveOnObserveReturn<Atom>;
  }

  if (isMutableAtom(atom)) {
    return atom.onObserve(
      {
        peek: storeApi.peekAtom,
        setSelf: (value) => {
          storeApi.setAtom(atom, value);
        },
      },
      atomValue
    ) as ResolveOnObserveReturn<Atom>;
  }

  if (isDerivedAtom(atom)) {
    return atom.onObserve({ peek: storeApi.peekAtom }, atomValue) as ResolveOnObserveReturn<Atom>;
  }

  if (isObserverAtom(atom)) {
    return atom.onObserve({ peek: storeApi.peekAtom }) as ResolveOnObserveReturn<Atom>;
  }

  throw new Error('Atom is not gettable');
}
