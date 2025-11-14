import { createDerivedAtom, createMutableAtom, createObserverAtom } from '../atom/createAtom';
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

export type Depromisify<PromiseValue, PromiseError = Error> =
  | DepromisifyPending
  | DepromisifyResolved<PromiseValue>
  | DepromisifyRejected<PromiseError>;

export const depromisifyAtom = <PromiseValue, PromiseError>(
  promiseAtom: ReadableAtom<Promise<PromiseValue>>
): DerivedAtom<Depromisify<PromiseValue, PromiseError>> => {
  const stateAtom = createMutableAtom<Depromisify<PromiseValue, PromiseError>>({
    state: 'pending',
  });
  const promiseResolverAtom = createObserverAtom(({ get, scheduleSet }) => {
    const promise = get(promiseAtom);

    promise
      .then((value) => {
        scheduleSet(stateAtom, {
          state: 'resolved',
          value,
        });
      })
      .catch((error) => {
        scheduleSet(stateAtom, {
          state: 'rejected',
          error,
        });
      });
  });

  return createDerivedAtom<Depromisify<PromiseValue, PromiseError>>(({ get }) => {
    // Read resolver atom so it will read the promise and update stateAtom.
    get(promiseResolverAtom);

    return get(stateAtom);
  });
};
