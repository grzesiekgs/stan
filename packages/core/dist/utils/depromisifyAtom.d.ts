import { DerivedAtom, ReadableAtom } from '../types';
export type DepromisifyState = 'pending' | 'resolved' | 'rejected';
export type DepromisifyPending = {
    state: 'pending';
    value?: never;
    error?: never;
};
export type DepromisifyResolved<PromiseValue> = {
    state: 'resolved';
    value: PromiseValue;
    error?: never;
};
export type DepromisifyRejected<PromiseError = Error> = {
    state: 'rejected';
    error: PromiseError;
    value?: never;
};
export type Depromisify<PromiseValue, PromiseError = Error> = DepromisifyPending | DepromisifyResolved<PromiseValue> | DepromisifyRejected<PromiseError>;
export declare const depromisifyAtom: <PromiseValue, PromiseError>(promiseAtom: ReadableAtom<Promise<PromiseValue>>) => DerivedAtom<Depromisify<PromiseValue, PromiseError>>;
