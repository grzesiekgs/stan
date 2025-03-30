import {
  MutableAtom,
  DerivedAtom,
  CallbackAtom,
  WriteAtom,
  ReadAtom,
  CreateReadableAtomOptions,
  AtomType,
} from '../types';

const defaultWrite: WriteAtom<any> = (args, value) => value;

export function createMutableAtom<Value>(
  value: Value,
  write?: WriteAtom<Value, Value>,
  options?: CreateReadableAtomOptions<Value>
): MutableAtom<Value, Value>;
export function createMutableAtom<Value, UpdateValue>(
  value: Value,
  write?: WriteAtom<UpdateValue, Value>,
  options?: CreateReadableAtomOptions<UpdateValue>
): MutableAtom<Value, UpdateValue>;
export function createMutableAtom<Value, UpdateValue = Value>(
  value: Value,
  write?: WriteAtom<UpdateValue, Value>,
  options?: CreateReadableAtomOptions<UpdateValue>
): MutableAtom<Value, UpdateValue> {
  return {
    type: 'mutable',
    read: (_, atomState) => {
      // Once atom is initialized, value is taken from atomState.
      if (atomState.isInitialized) {
        return atomState.value;
      }
      // For first read call, value is taken from initilizer.
      return value;
    },
    write: write ?? defaultWrite,
    onObserve: options?.onObserve,
    storeLabel: options?.storeLabel,
  };
}

export const createDerivedAtom = <Value, UpdateValue = never, UpdateResult = UpdateValue>(
  read: ReadAtom<Value>,
  ...[write, options]: [UpdateValue] extends [never]
    ? [write?: undefined, options?: CreateReadableAtomOptions<never>]
    : [
        write: WriteAtom<UpdateValue, UpdateResult>,
        options?: CreateReadableAtomOptions<UpdateValue>
      ]
): DerivedAtom<Value, UpdateValue, UpdateResult> =>
  ({
    type: 'derived',
    read,
    write,
    onObserve: options?.onObserve,
    storeLabel: options?.storeLabel,
  } as DerivedAtom<Value, UpdateValue, UpdateResult>);

export const createCallbackAtom = <UpdateValue, UpdateResult = UpdateValue>(
  write: WriteAtom<UpdateValue, UpdateResult>
): CallbackAtom<UpdateValue, UpdateResult> => ({
  type: 'callback',
  write,
});

type AtomCreator<T extends AtomType> = T extends 'mutable'
  ? typeof createMutableAtom
  : T extends 'derived'
  ? typeof createDerivedAtom
  : typeof createCallbackAtom;

export const createAtom = <AT extends AtomType>(atomType: AT): AtomCreator<AT> => {
  if (atomType === 'mutable') {
    return createMutableAtom as AtomCreator<AT>;
  }

  if (atomType === 'derived') {
    return createDerivedAtom as AtomCreator<AT>;
  }

  if (atomType === 'callback') {
    return createCallbackAtom as AtomCreator<AT>;
  }

  throw new Error(`Invalid atom type: ${atomType}`);
};
