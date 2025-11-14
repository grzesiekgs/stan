import {
  MutableAtom,
  DerivedAtom,
  CallbackAtom,
  WriteAtom,
  ReadAtom,
  CreateReadableAtomOptions,
  AtomType,
  ObserverAtom,
} from '../types';

const defaultRead: ReadAtom<any> = (_, atomState) => atomState.value;
const defaultWrite: WriteAtom<any> = (args, value) => value;

export function createMutableAtom<Value>(
  value: Value,
  write?: undefined,
  options?: CreateReadableAtomOptions<Value>
): MutableAtom<Value, Value>;
export function createMutableAtom<Value, UpdateValue>(
  value: Value,
  write: WriteAtom<UpdateValue, Value>,
  options?: CreateReadableAtomOptions<UpdateValue>
): MutableAtom<Value, UpdateValue>;
export function createMutableAtom<Value, UpdateValue = Value>(
  value: Value,
  write?: WriteAtom<UpdateValue, Value>,
  options?: CreateReadableAtomOptions<UpdateValue>
): MutableAtom<Value, UpdateValue> {
  return {
    type: 'mutable',
    initialValue: value,
    read: defaultRead,
    write: write ?? defaultWrite,
    onObserve: options?.onObserve,
    storeLabel: options?.storeLabel,
  } as MutableAtom<Value, UpdateValue>;
}

export function createDerivedAtom<Value>(
  read: ReadAtom<Value>,
  write?: undefined,
  options?: CreateReadableAtomOptions<never>
): DerivedAtom<Value, never, never>;
export function createDerivedAtom<Value, UpdateValue, UpdateResult = UpdateValue>(
  read: ReadAtom<Value>,
  write: WriteAtom<UpdateValue, UpdateResult>,
  options?: CreateReadableAtomOptions<UpdateValue>
): DerivedAtom<Value, UpdateValue, UpdateResult>;
export function createDerivedAtom<Value, UpdateValue = never, UpdateResult = UpdateValue>(
  read: ReadAtom<Value>,
  write?: WriteAtom<UpdateValue, UpdateResult>,
  options?: CreateReadableAtomOptions<UpdateValue>
): DerivedAtom<Value, UpdateValue, UpdateResult> {
  return {
    type: 'derived',
    read,
    write,
    onObserve: options?.onObserve,
    storeLabel: options?.storeLabel,
  } as DerivedAtom<Value, UpdateValue, UpdateResult>;
}
export function createObserverAtom(read: ReadAtom<void>): ObserverAtom {
  return {
    type: 'observer',
    // Make sure to ignore return value of `read`.
    read: (...args) => {
      read(...args);
    },
  };
}

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
    : T extends 'observer'
      ? typeof createObserverAtom
      : typeof createCallbackAtom;

export const createAtom = <AT extends AtomType>(atomType: AT): AtomCreator<AT> => {
  if (atomType === 'mutable') {
    return createMutableAtom as AtomCreator<AT>;
  }

  if (atomType === 'derived') {
    return createDerivedAtom as AtomCreator<AT>;
  }

  if (atomType === 'observer') {
    return createObserverAtom as AtomCreator<AT>;
  }

  if (atomType === 'callback') {
    return createCallbackAtom as AtomCreator<AT>;
  }

  throw new Error(`Invalid atom type: ${atomType}`);
};
