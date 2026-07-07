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
  AtomOnObserveResult,
  Store,
} from '../types';

type ResolveOnObserveAtomValue<A extends GettableAtom> = A extends MutableAtom<infer V, any>
  ? V
  : A extends DerivedAtom<infer V, any, any>
    ? V
    : A extends ObserverAtom
      ? void
      : never;

export type ResolveOnObserveReturn<A extends GettableAtom> = A extends MutableAtom<
  infer V,
  infer U
>
  ? AtomOnObserveResult<V, U> | NoOnObserveInitialValueSymbolType
  : A extends DerivedAtom<infer V, any, any>
    ? AtomOnObserveResult<V, never> | NoOnObserveInitialValueSymbolType
    : A extends ObserverAtom
      ? AtomOnObserveResult<void, never> | NoOnObserveInitialValueSymbolType
      : never;

export const isMutableAtom = <Value, UpdateValue>(
  atom: AnyAtom | MutableAtom<Value, UpdateValue>
): atom is MutableAtom<Value, UpdateValue> => atom.type === 'mutable';

export const isDerivedAtom = <Value, UpdateValue = any, UpdateResult = any>(
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
  AtomType extends SettableAtomType,
  UpdateValue,
  UpdateResult,
  DerivedValue extends SettableAtomDerivedValue<AtomType, UpdateResult> = SettableAtomDerivedValue<
    AtomType,
    UpdateResult
  >,
>(
  atom: AnyAtom | SettableAtom<AtomType, UpdateValue, UpdateResult, DerivedValue>
): atom is SettableAtom<AtomType, UpdateValue, UpdateResult, DerivedValue> =>
  'write' in atom || 'callback' in atom;

export function resolveAtomOnObserve<A extends GettableAtom>(
  atom: A,
  atomValue: ResolveOnObserveAtomValue<A>,
  storeApi: Store
): ResolveOnObserveReturn<A> {
  if (!atom.onObserve) {
    return NoOnObserveInitialValueSymbol as ResolveOnObserveReturn<A>;
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
    ) as ResolveOnObserveReturn<A>;
  }

  if (isDerivedAtom(atom)) {
    return atom.onObserve({ peek: storeApi.peekAtom }, atomValue) as ResolveOnObserveReturn<A>;
  }

  if (isObserverAtom(atom)) {
    return atom.onObserve({ peek: storeApi.peekAtom }, atomValue) as ResolveOnObserveReturn<A>;
  }

  throw new Error('Atom is not gettable');
}
