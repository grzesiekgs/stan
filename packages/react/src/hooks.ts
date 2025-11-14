import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  ReadableAtom,
  WritableAtom,
  createStore,
  isWritableAtom,
  isReadableAtom,
} from '@stan/core';

// TODO Provide store via react context.
export const testStore = createStore();

type SubscribeToStore = (callback: VoidFunction) => VoidFunction;
type GetStoreSnapshot<Value> = () => Value;
type SyncExternalStoreArgs<Value> = [SubscribeToStore, GetStoreSnapshot<Value>];

const buildSyncExternalStoreArgs = <Value>(
  readableAtom: ReadableAtom<Value>
): SyncExternalStoreArgs<Value> => [
  (callback) => testStore.observeAtomValue(readableAtom, callback),
  () => testStore.peekAtomValue(readableAtom),
];

export const useAtomValue = <Value>(readableAtom: ReadableAtom<Value>): Value => {
  const [subscribe, getSnapshot] = useMemo(
    () => buildSyncExternalStoreArgs(readableAtom),
    [readableAtom]
  );
  const value = useSyncExternalStore(subscribe, getSnapshot);

  return value;
};

export type SetAtomValue<Update, Result> = (update: Update) => Result;

export const useSetAtomValue = <Update, Result>(
  writableAtom: WritableAtom<Update, Result>
): SetAtomValue<Update, Result> => {
  if (!isWritableAtom<Update, Result>(writableAtom)) {
    throw new Error('Tried to write non-writable atom');
  }

  return useCallback<SetAtomValue<Update, Result>>(
    (update) => testStore.setAtomValue(writableAtom, update),
    [writableAtom]
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

  return useCallback<CallbackSetAtom<Update, Result, Value | undefined>>(
    (updateCallback) => {
      const updateCallbackValue = isReadableAtom<Value>(writableAtom)
        ? testStore.peekAtomValue(writableAtom)
        : undefined;
      const updateValue = updateCallback(updateCallbackValue);

      return testStore.setAtomValue<Update, Result>(writableAtom, updateValue);
    },
    [writableAtom]
  );
}
