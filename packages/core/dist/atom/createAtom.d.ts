import { MutableAtom, DerivedAtom, CallbackAtom, WriteAtom, ReadAtom, CreateReadableAtomOptions, AtomType } from '../types';
export declare function createMutableAtom<Value>(value: Value, write?: undefined, options?: CreateReadableAtomOptions<Value>): MutableAtom<Value, Value>;
export declare function createMutableAtom<Value, UpdateValue>(value: Value, write: WriteAtom<UpdateValue, Value>, options?: CreateReadableAtomOptions<UpdateValue>): MutableAtom<Value, UpdateValue>;
export declare function createDerivedAtom<Value>(read: ReadAtom<Value>, write?: undefined, options?: CreateReadableAtomOptions<never>): DerivedAtom<Value, never, never>;
export declare function createDerivedAtom<Value, UpdateValue, UpdateResult = UpdateValue>(read: ReadAtom<Value>, write: WriteAtom<UpdateValue, UpdateResult>, options?: CreateReadableAtomOptions<UpdateValue>): DerivedAtom<Value, UpdateValue, UpdateResult>;
export declare const createCallbackAtom: <UpdateValue, UpdateResult = UpdateValue>(write: WriteAtom<UpdateValue, UpdateResult>) => CallbackAtom<UpdateValue, UpdateResult>;
type AtomCreator<T extends AtomType> = T extends 'mutable' ? typeof createMutableAtom : T extends 'derived' ? typeof createDerivedAtom : typeof createCallbackAtom;
export declare const createAtom: <AT extends AtomType>(atomType: AT) => AtomCreator<AT>;
export {};
