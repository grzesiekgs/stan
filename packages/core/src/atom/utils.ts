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
  atom: AnyAtom | MutableAtom<Value, UpdateValue>
): atom is MutableAtom<Value, UpdateValue> => atom.type === 'mutable';

export const isDerivedAtom = <Value, UpdateValue = any, UpdateResult = any>(
  atom: AnyAtom | DerivedAtom<Value, UpdateValue, UpdateResult>
): atom is DerivedAtom<Value, UpdateValue, UpdateResult> => atom.type === 'derived';

export const isObserverAtom = (atom: AnyAtom | ObserverAtom): atom is ObserverAtom =>
  atom.type === 'observer';

export const isDependentAtom = <Value>(
  atom: AnyAtom | DependentAtom<Value>
): atom is DependentAtom<Value> => isDerivedAtom(atom) || isObserverAtom(atom);

export const isCallbackAtom = <UpdateValue, UpdateResult>(
  atom: AnyAtom | CallbackAtom<UpdateValue, UpdateResult>
): atom is CallbackAtom<UpdateValue, UpdateResult> => atom.type === 'callback';

export const isReadableAtom = <Value>(
  atom: AnyAtom | ReadableAtom<Value>
): atom is ReadableAtom<Value> => 'read' in atom;

export const isWritableAtom = <Value, UpdateValue>(
  atom: AnyAtom | WritableAtom<Value, UpdateValue>
): atom is WritableAtom<Value, UpdateValue> => 'write' in atom;
