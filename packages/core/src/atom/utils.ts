import {
  AnyAtom,
  CallbackAtom,
  DependentAtom,
  DerivedAtom,
  MutableAtom,
  ObserverAtom,
  ReadableAtom,
  WritableAtom,
} from '../types';

export const isMutableAtom = <Value, UpdateValue>(
  atom: AnyAtom
): atom is MutableAtom<Value, UpdateValue> => atom.type === 'mutable';

export const isDerivedAtom = <Value, UpdateValue, UpdateResult>(
  atom: AnyAtom
): atom is DerivedAtom<Value, UpdateValue, UpdateResult> => atom.type === 'derived';

export const isObserverAtom = (atom: AnyAtom): atom is ObserverAtom => atom.type === 'observer';

export const isDependentAtom = <Value>(atom: AnyAtom): atom is DependentAtom<Value> =>
  isDerivedAtom(atom) || isObserverAtom(atom);

export const isCallbackAtom = <UpdateValue, UpdateResult>(
  atom: AnyAtom
): atom is CallbackAtom<UpdateValue, UpdateResult> => atom.type === 'callback';

export const isReadableAtom = <Value>(atom: AnyAtom): atom is ReadableAtom<Value> => 'read' in atom;

export const isWritableAtom = <Value, UpdateValue>(
  atom: AnyAtom
): atom is WritableAtom<Value, UpdateValue> => 'write' in atom;
