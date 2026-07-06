import { use, useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  ReadableAtom,
  WritableAtom,
  isWritableAtom,
  isReadableAtom,
  Store,
  UnwrapPromise,
} from '@stan/core';
import { useStore } from './context';

type SubscribeToStore = (callback: VoidFunction) => VoidFunction;
type GetStoreSnapshot<Value> = () => Value;
type SyncExternalStoreArgs<Value> = [SubscribeToStore, GetStoreSnapshot<Value>];

const buildSyncExternalStoreArgs = <Value>(
  store: Store,
  readableAtom: ReadableAtom<Value>
): SyncExternalStoreArgs<Value> => [
  (callback) => store.observeAtomValue(readableAtom, callback),
  () => store.peekAtomValue(readableAtom),
];

export const useAtomValue = <Value>(readableAtom: ReadableAtom<Value>): UnwrapPromise<Value> => {
  if (!isReadableAtom<Value>(readableAtom)) {
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

export const useSetAtomValue = <Update, Result>(
  writableAtom: WritableAtom<Update, Result>
): SetAtomValue<Update, Result> => {
  if (!isWritableAtom<Update, Result>(writableAtom)) {
    throw new Error('Tried to write non-writable atom');
  }

  const store = useStore();

  return useCallback<SetAtomValue<Update, Result>>(
    (update) => store.setAtomValue(writableAtom, update),
    [store, writableAtom]
  );
};

export type UpdateCallback<Value, Update> = (currentValue: Value) => Update;
export type CallbackSetAtom<Update, Result, Value> = (
  updateCallback: UpdateCallback<Value, Update>
) => Result;

export function useSetAtomCallback<Update, Result, Value>(
  writableAtom: WritableAtom<Update, Result> & ReadableAtom<Value>
): CallbackSetAtom<Update, Result, Value>;
export function useSetAtomCallback<Update, Result>(
  writableAtom: WritableAtom<Update, Result>
): CallbackSetAtom<Update, Result, undefined>;
export function useSetAtomCallback<Update, Result, Value>(
  writableAtom: WritableAtom<Update, Result>
): CallbackSetAtom<Update, Result, Value | undefined> {
  if (!isWritableAtom(writableAtom)) {
    throw new Error('Tried to write non-writable atom');
  }

  const store = useStore();

  return useCallback<CallbackSetAtom<Update, Result, Value | undefined>>(
    (updateCallback) => {
      const updateCallbackValue = isReadableAtom<Value>(writableAtom)
        ? store.peekAtomValue(writableAtom)
        : undefined;
      const updateValue = updateCallback(updateCallbackValue);

      return store.setAtomValue<Update, Result>(writableAtom, updateValue);
    },
    [store, writableAtom]
  );
}
