import { use, useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  GettableAtom,
  AnySettableAtom,
  MutableAtom,
  SettableDerivedAtom,
  CallbackAtom,
  isSettableAtom,
  isGettableAtom,
  Store,
  UnwrapPromise,
} from '@stan/core';
import { useStore } from './context';

type SubscribeToStore = (callback: VoidFunction) => VoidFunction;
type GetStoreSnapshot<Value> = () => Value;
type SyncExternalStoreArgs<Value> = [SubscribeToStore, GetStoreSnapshot<Value>];

const buildSyncExternalStoreArgs = <Value>(
  store: Store,
  readableAtom: GettableAtom<Value>
): SyncExternalStoreArgs<Value> => [
  (callback) => store.observeAtom(readableAtom, callback),
  () => store.peekAtom(readableAtom),
];

export const useAtomValue = <Value>(readableAtom: GettableAtom<Value>): UnwrapPromise<Value> => {
  if (!isGettableAtom<Value>(readableAtom)) {
    throw new Error('Tried to read non-readable atom');
  }

  const store = useStore();
  const [subscribe, getSnapshot] = useMemo(
    () => buildSyncExternalStoreArgs(store, readableAtom),
    [store, readableAtom]
  );
  const value = useSyncExternalStore(subscribe, getSnapshot);

  if (value instanceof Promise) {
    return use(value);
  }
  // TODO I would like to get rid of this type casting. Most likely type guard will be required.
  return value as UnwrapPromise<Value>;
};

export type SetAtomValue<Update, Result> = (update: Update) => Result;

export const useSetAtomValue = <Update, Result, Tracked>(
  writableAtom: AnySettableAtom<Update, Result, Tracked>
): SetAtomValue<Update, Result> => {
  if (!isSettableAtom(writableAtom)) {
    throw new Error('Tried to write non-writable atom');
  }

  const store = useStore();

  return useCallback<SetAtomValue<Update, Result>>(
    (update) => store.setAtom(writableAtom, update),
    [store, writableAtom]
  );
};

export type UpdateCallback<Value, Update> = (currentValue: Value) => Update;
export type CallbackSetAtom<Update, Result, Value> = (
  updateCallback: UpdateCallback<Value, Update>
) => Result;

export function useSetAtomCallback<Update, Result, Value>(
  writableAtom: SettableDerivedAtom<Value, Update, Result>
): CallbackSetAtom<Update, Result, Value>;
export function useSetAtomCallback<Update, Result>(
  writableAtom: MutableAtom<Result, Update>
): CallbackSetAtom<Update, Result, Result>;
export function useSetAtomCallback<Update, Result>(
  writableAtom: CallbackAtom<Update, Result>
): CallbackSetAtom<Update, Result, undefined>;
export function useSetAtomCallback<Update, Result, Value>(
  writableAtom:
    | MutableAtom<Result, Update>
    | SettableDerivedAtom<Value, Update, Result>
    | CallbackAtom<Update, Result>
): CallbackSetAtom<Update, Result, Value | undefined> {
  if (!isSettableAtom(writableAtom)) {
    throw new Error('Tried to write non-writable atom');
  }

  const store = useStore();

  return useCallback<CallbackSetAtom<Update, Result, Value | undefined>>(
    (updateCallback) => {
      const updateCallbackValue = isGettableAtom<Value>(writableAtom)
        ? store.peekAtom(writableAtom)
        : undefined;
      const updateValue = updateCallback(updateCallbackValue);

      return store.setAtom<Update, Result, Value>(writableAtom, updateValue);
    },
    [store, writableAtom]
  );
}
