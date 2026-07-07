import { createDerivedAtom, createMutableAtom, createObserverAtom } from '../atom/createAtom';
import { DerivedAtom, GettableAtom } from '../types';
import { isReadableValueCalculated } from './isReadableValueCalculated';

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
  promiseAtom: GettableAtom<Promise<PromiseValue>>
): DerivedAtom<Depromisify<PromiseValue, PromiseError>, void> => {
  const promiseSet = new Set<Promise<PromiseValue>>();
  const stateAtom = createMutableAtom<
    Depromisify<PromiseValue, PromiseError>,
    Depromisify<PromiseValue, PromiseError>
  >(
    {
      state: 'pending',
    },
    (_, update, current) => {
      // TODO explain this better, it's about receiving new promise before previous promise resolved.
      // Avoid unecessary updates if promise never resolved but promise has changed.
      if (update.state === 'pending' && update.state === current.state) {
        return current;
      }
      // Maybe we need to add some extra logic there to extend guard above, but let's see.
      if (update.state === current.state) {
        console.warn('depromisifyAtom similar states', update, current);
      }

      return update;
    }
  );
  const processingPromiseAtom = createDerivedAtom<Promise<PromiseValue>>(({ get }, lastPromise) => {
    const promise = get(promiseAtom);
    // Safeguard, should never happen.
    if (promiseSet.has(promise)) {
      throw new Error('depromisifyAtom somehow recalculated without changing promise reference!');
    }
    // promiseProxyAtom can recalculate only if promise reference has changed (see above),
    // therefore if lastPromise is calculated, it means that we should no longer track it in promiseResolverAtom.
    if (isReadableValueCalculated(lastPromise)) {
      promiseSet.delete(lastPromise);
    }

    promiseSet.add(promise);

    return promise;
  });
  const promiseResolverAtom = createObserverAtom(({ get, scheduleSet }) => {
    const promise = get(processingPromiseAtom);
    // Each time when processingPromiseAtom has changed, it means that promise reference did update,
    // therefore we want to reset promise state, as we don't know yet is new promise resolve or not.
    // Ideally, if promise is resolved, we should call observerAtoms only after scheduleSet call seen above,
    // but let's test is it actually working :D
    scheduleSet(stateAtom, { state: 'pending' });

    promise
      .then((value) => {
        // We already started processing different promise.
        if (!promiseSet.has(promise)) {
          return;
        }

        scheduleSet(stateAtom, {
          state: 'resolved',
          value,
        });
      })
      .catch((error) => {
        // We already started processing different promise.
        if (!promiseSet.has(promise)) {
          return;
        }

        scheduleSet(stateAtom, {
          state: 'rejected',
          error,
        });
      });
  });

  return createDerivedAtom<Depromisify<PromiseValue, PromiseError>>(({ get }) => {
    // Read resolver atom so it will read the promise and update stateAtom.
    // NOTE that we are reading observer inside of derived, let's see does it actually works :D
    get(promiseResolverAtom);

    return get(stateAtom);
  });
};
