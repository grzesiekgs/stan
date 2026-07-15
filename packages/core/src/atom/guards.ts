import { EmptyAtomValueSymbolType } from '../symbols';
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
} from '../types';

export const isMutableAtom = <Value, UpdateValue>(
  atom: AnyAtom | MutableAtom<Value, UpdateValue>
): atom is MutableAtom<Value, UpdateValue> => atom.type === 'mutable';

export function isDerivedAtom<
  Update,
  UpdateResult,
  TrackedValue extends SettableAtomDerivedValue<'derived', UpdateResult>,
>(
  atom: SettableAtom<Update, UpdateResult, SettableAtomType, TrackedValue>
): atom is DerivedAtom<TrackedValue, Update, UpdateResult> &
  SettableAtom<Update, UpdateResult, 'derived', TrackedValue | EmptyAtomValueSymbolType>;
export function isDerivedAtom<Value, UpdateValue, UpdateResult>(
  atom: AnyAtom
): atom is DerivedAtom<Value, UpdateValue, UpdateResult>;
export function isDerivedAtom(atom: AnyAtom): atom is DerivedAtom<any, any, any> {
  return atom.type === 'derived';
}

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
