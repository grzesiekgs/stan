import { EmptyAtomValueSymbolType } from '../symbols';
import {
  MutableAtom,
  DerivedAtom,
  CallbackAtom,
  AtomWrite,
  AtomRead,
  CreateGettableAtomOptions,
  EveryAtomType,
  ObserverAtom,
  AtomCallback,
  MutableAtomGetInitialValue,
} from '../types';

const defaultRead: AtomRead<any> = (_, atomState) => atomState.value;
const defaultWrite: AtomWrite<any> = (_args, value) => value;
/** TODO!!! CONSIDER THIS AS THIS WOULD REQUIRE SIGNIFICANT TYPES REFACTOR!
 * 
 * for createMutableAtom -  This atom should be able to only modify itself via it's setter.
 *                          keep 'write' function, but remove 'set' from it, leave 'peek',
 *                          but also add 'currentValue'.
 * for createDerivedAtom -  This atom should be able to call other atom setters, but not modify itself,
 *                          since it's value is always derived from other atoms.
 *                          This is basically createCallbackAtom but with access to 'currentValue', since
                            it helds derived value
 * for createCallbackAtom - This atom should be able to call other atom setters, but not midify itself
                            since it never helds value
                            replace 'write' with 'callback', keep 'set' and 'peek', this atom never set's itself
                            therefore it's return value is just 'store callback signal' - never persisted
                            callbackAtom doesn't have access to 'currentValue' (but derivedAtom does)
 */
export function createMutableAtom<Value>(
  getInitialValue: MutableAtomGetInitialValue<Value>,
  write?: undefined,
  options?: CreateGettableAtomOptions<Value, Value>
): MutableAtom<Value, Value>;
export function createMutableAtom<Value, Update>(
  getInitialValue: MutableAtomGetInitialValue<Value>,
  write: AtomWrite<Value, Update>,
  options?: CreateGettableAtomOptions<Value, Update>
): MutableAtom<Value, Update>;
export function createMutableAtom<Value, Update = Value>(
  getInitialValue: MutableAtomGetInitialValue<Value>,
  write?: AtomWrite<Value, Update>,
  options?: CreateGettableAtomOptions<Value, Update>
): MutableAtom<Value, Update> {
  return {
    type: 'mutable',
    getInitialValue,
    read: defaultRead,
    write: write ?? defaultWrite,
    onObserve: options?.onObserve,
    storeLabel: options?.storeLabel,
  } as MutableAtom<Value, Update>;
}

export function createDerivedAtom<Value>(
  read: AtomRead<Value>,
  callback?: undefined,
  options?: CreateGettableAtomOptions<Value, never>
): DerivedAtom<Value>;
export function createDerivedAtom<Value, UpdateValue>(
  read: AtomRead<Value>,
  callback: AtomCallback<UpdateValue, UpdateValue, Value | EmptyAtomValueSymbolType>,
  options?: CreateGettableAtomOptions<Value, never>
): DerivedAtom<Value, UpdateValue, UpdateValue>;
export function createDerivedAtom<Value, UpdateValue, UpdateResult>(
  read: AtomRead<Value>,
  callback: AtomCallback<UpdateValue, UpdateResult, Value | EmptyAtomValueSymbolType>,
  options?: CreateGettableAtomOptions<Value, never>
): DerivedAtom<Value, UpdateValue, UpdateResult>;
export function createDerivedAtom<Value, UpdateValue, UpdateResult = UpdateValue>(
  read: AtomRead<Value>,
  callback?: AtomCallback<UpdateValue, UpdateResult, Value | EmptyAtomValueSymbolType>,
  options?: CreateGettableAtomOptions<Value, never>
): DerivedAtom<Value, UpdateValue, UpdateResult> {
  if (callback === undefined) {
    return {
      type: 'derived',
      read,
      onObserve: options?.onObserve,
      storeLabel: options?.storeLabel,
    } as DerivedAtom<Value, UpdateValue, UpdateResult>;
  }

  return {
    type: 'derived',
    read,
    callback,
    onObserve: options?.onObserve,
    storeLabel: options?.storeLabel,
  } as DerivedAtom<Value, UpdateValue, UpdateResult>;
}
export function createObserverAtom(
  read: AtomRead<void>,
  options?: CreateGettableAtomOptions<void, never>
): ObserverAtom {
  return {
    type: 'observer',
    storeLabel: options?.storeLabel,
    read: (readArgs, lastValue) => {
      // Make sure to ignore return value of `read` as observer should never have it's own value.
      read(readArgs);

      return lastValue;
    },
    onObserve: options?.onObserve,
  } as ObserverAtom;
}

export const createCallbackAtom = <UpdateValue, UpdateResult = UpdateValue>(
  callback: AtomCallback<UpdateValue, UpdateResult>
): CallbackAtom<UpdateValue, UpdateResult> => ({
  type: 'callback',
  callback,
});

type AtomCreator<T extends EveryAtomType> = T extends 'mutable'
  ? typeof createMutableAtom
  : T extends 'derived'
    ? typeof createDerivedAtom
    : T extends 'observer'
      ? typeof createObserverAtom
      : typeof createCallbackAtom;

export const createAtom = <AT extends EveryAtomType>(atomType: AT): AtomCreator<AT> => {
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
