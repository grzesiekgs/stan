import { AnyAtom, CallbackAtom, DependentAtom, DerivedAtom, MutableAtom, ObserverAtom, ReadableAtom, WritableAtom } from '../types';
export declare const isMutableAtom: <Value, UpdateValue>(atom: AnyAtom) => atom is MutableAtom<Value, UpdateValue>;
export declare const isDerivedAtom: <Value, UpdateValue, UpdateResult>(atom: AnyAtom) => atom is DerivedAtom<Value, UpdateValue, UpdateResult>;
export declare const isObserverAtom: (atom: AnyAtom) => atom is ObserverAtom;
export declare const isDependentAtom: <Value>(atom: AnyAtom) => atom is DependentAtom<Value>;
export declare const isCallbackAtom: <UpdateValue, UpdateResult>(atom: AnyAtom) => atom is CallbackAtom<UpdateValue, UpdateResult>;
export declare const isReadableAtom: <Value>(atom: AnyAtom) => atom is ReadableAtom<Value>;
export declare const isWritableAtom: <Value, UpdateValue>(atom: AnyAtom) => atom is WritableAtom<Value, UpdateValue>;
