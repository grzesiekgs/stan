import { ReadableAtom, WritableAtom } from '@stan/core';
export declare const testStore: import('@stan/core').Store;
export declare const useAtomValue: <Value>(readableAtom: ReadableAtom<Value, any>) => Value;
export type SetAtomValue<Update, Result> = (update: Update) => Result;
export declare const useSetAtomValue: <Update, Result>(writableAtom: WritableAtom<Update, Result>) => SetAtomValue<Update, Result>;
export type UpdateCallback<Value, Update> = (currentValue: Value) => Update;
export type CallbackSetAtom<Update, Result, Value> = (updateCallback: UpdateCallback<Value, Update>) => Result;
export declare function useSetAtomCallback<Update, Result, Value>(writableAtom: WritableAtom<Update, Result> & ReadableAtom<Value>): CallbackSetAtom<Update, Result, Value>;
export declare function useSetAtomCallback<Update, Result>(writableAtom: WritableAtom<Update, Result>): CallbackSetAtom<Update, Result, undefined>;
