import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { isReadableAtom, isWritableAtom } from './stan/createAtom/utils';
import {
  Atom,
  CallbackAtom,
  DerivedAtom,
  MutableAtom,
  ReadableAtom,
  WritableAtom,
} from './stan/types';
import { createMutableAtom } from './stan/createAtom/createAtom';
import { createStore } from './stan/store/store';
// TODO Provide store via react context.
const testStore = createStore();

type SubscribeToStore = (callback: VoidFunction) => VoidFunction;
type GetStoreSnapshot<Value> = () => Value;
type SyncExternalStoreArgs<Value> = [SubscribeToStore, GetStoreSnapshot<Value>];

const buildSyncExternalStoreArgs = <Value>(
  readableAtom: ReadableAtom<Value, any>
): SyncExternalStoreArgs<Value> => [
  (callback) => testStore.observeAtom(readableAtom, callback),
  () => testStore.peekAtom(readableAtom),
];

export const useAtomValue = <Value>(readableAtom: ReadableAtom<Value, any>): Value => {
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
  if (!isWritableAtom(writableAtom)) {
    throw new Error('Tried to write non-writable atom');
  }

  return useCallback<SetAtomValue<Update, Result>>(
    (update) => testStore.setAtom<Update, Result>(writableAtom, update),
    [writableAtom]
  );
};

export type UpdateCallback<Value, Update> = (currentValue: Value) => Update;
export type CallbackSetAtom<Update, Result, Value> = (updateCallback: UpdateCallback<Value, Update>) => Result;

export function useSetAtomCallback<Update, Result>(
  writableAtom: WritableAtom<Update, Result>
): CallbackSetAtom<undefined, Update, Result>
export function useSetAtomCallback<Update, Result, Value>(
  writableAtom: WritableAtom<Update, Result> & ReadableAtom<Value, Update>
): CallbackSetAtom<Update, Result, Value>
export function useSetAtomCallback<Update, Result, Value>(
  writableAtom: WritableAtom<Update, Result> | (WritableAtom<Update, Result> & ReadableAtom<Value, Update>)
): CallbackSetAtom<Update, Result, typeof writableAtom extends ReadableAtom<infer Value, Update> ? Value : undefined> {
  if (!isWritableAtom(writableAtom)) {
    throw new Error('Tried to write non-writable atom');
  }

  type AtomValue = typeof writableAtom extends ReadableAtom<infer Value, Update> ? Value : undefined

  return useCallback<CallbackSetAtom<Update, Result, AtomValue>>(
    (updateCallback) => {
      const updateCallbackValue = isReadableAtom<AtomValue, Update>(writableAtom) ? testStore.peekAtom(writableAtom) : undefined;
      const updateValue = updateCallback(updateCallbackValue);

      return testStore.setAtom<Update, Result>(writableAtom, updateValue);
    },
    [writableAtom]
  );
};


// TEST
const mutableAtom = createMutableAtom(0);
const mutable = useAtomValue(mutableAtom);
const setMutable = useSetAtomValue(mutableAtom);
const setMutableResult = setMutable(0);
const setMutableCallback = useSetAtomCallback(mutableAtom);
const setMutableCallbackResult = setMutableCallback((value) => value + 1);




const mutableFunctionAtom = createMutableAtom(() => 0);
const mutableFunction = useAtomValue(mutableFunctionAtom);
const setMutableFunction = useSetAtomValue(mutableFunctionAtom);
const setMutableFunctionResult = setMutableFunction(() => 0);
const setMutableFunctionCallback = useSetAtomCallback(mutableFunctionAtom);
const setMutableFunctionCallbackResult = setMutableFunctionCallback((value) => value + 1);





const mutableWithWriteAtom = createMutableAtom<number, string>(0, (update) => Number(update));
const mutableWithWrite = useAtomValue(mutableWithWriteAtom);
const setMutableWithWrite = useSetAtomValue(mutableWithWriteAtom);
const setMutableWithWriteResult = setMutableWithWrite('0');


type TestMutableCallbackType = CallbackSetAtom<string, number, typeof mutableWithWriteAtom extends ReadableAtom<infer Value, string> ? Value : undefined>