import { AnyAtom, Atom, MutableAtom, StatefulAtom, WritableAtom } from '../types';
import {
  CreateAtomArgs,
  CreateCallbackAtomArgs,
  CreateDerivedAtomArgs,
  CreateMutableAtomArgs,
} from './types';

export const isCreateMutableAtomArgs = <Value, UpdateValue>(
  args: CreateAtomArgs<Value, UpdateValue, any>
): args is CreateMutableAtomArgs<Value, UpdateValue> => 'initialValue' in args;

export const isCreateDerivedAtomArgs = <Value>(
  args: CreateAtomArgs<Value, any, any>
): args is CreateDerivedAtomArgs<Value> => 'getter' in args;

export const isCreateCallbackAtomArgs = <Value, UpdateValue, UpdateResult>(
  args: CreateAtomArgs<Value, UpdateValue, UpdateResult>
): args is CreateCallbackAtomArgs<UpdateValue, UpdateResult> =>
  'setter' in args && !('initialValue' in args);

export const isMutableAtom = <Value, UpdateValue>(
  atom: StatefulAtom<Value, UpdateValue> | WritableAtom<UpdateValue, Value>
): atom is MutableAtom<Value, UpdateValue> => 'initialValue' in atom;

export const isStatefulAtom = <Value>(atom: AnyAtom): atom is StatefulAtom<Value> =>
  'initialValue' in atom || 'read' in atom;

export const isWritableAtom = <Value, UpdateValue>(
  atom: AnyAtom
): atom is WritableAtom<Value, UpdateValue> => 'write' in atom;
