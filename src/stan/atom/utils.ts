import { AnyAtom, CallbackAtom, DerivedAtom, MutableAtom, ReadableAtom, WritableAtom } from '../types';

export const isMutableAtom = <Value, UpdateValue>(atom: AnyAtom): atom is MutableAtom<Value, UpdateValue> =>
  atom.type === 'mutable';

export const isDerivedAtom = <Value, UpdateValue, UpdateResult>(atom: AnyAtom): atom is DerivedAtom<Value, UpdateValue, UpdateResult> => atom.type === 'derived'

export const isCallbackAtom = <UpdateValue, UpdateResult>(atom: AnyAtom): atom is CallbackAtom<UpdateValue, UpdateResult> => atom.type === 'callback'

export const isReadableAtom = <Value>(atom: AnyAtom): atom is ReadableAtom<Value> => 'read' in atom;

export const isWritableAtom = <Value, UpdateValue>(atom: AnyAtom): atom is WritableAtom<Value, UpdateValue> => 'write' in atom;