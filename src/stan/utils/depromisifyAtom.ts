import { createAtom } from '../atom/atom';
import { Atom, DerivedAtom, StatefulAtom } from '../types';

export type DepromisifyPending<PromiseValue> = {
  state: 'pending';
  promise: Promise<PromiseValue>;
};

export type DepromisifyResolved<PromiseValue> = {
  state: 'resolved';
  value: PromiseValue;
  promise: Promise<PromiseValue>;
};

export type DepromisifyRejected<PromiseValue, PromiseError = Error> = {
  state: 'rejected';
  error: PromiseError;
  promise: Promise<PromiseValue>;
};

export type Depromisify<PromiseValue, PromiseError = Error> =
  | DepromisifyPending<PromiseValue>
  | DepromisifyResolved<PromiseValue>
  | DepromisifyRejected<PromiseValue, PromiseError>;

export const depromisifyAtom = <PromiseValue, PromiseError>(
  promiseAtom: StatefulAtom<Promise<PromiseValue>>
): DerivedAtom<Depromisify<PromiseValue, PromiseError>> => {
  const emptyValueSymbol = Symbol('empty-value');
  const valueAtom = createAtom<null | [PromiseValue, null] | [null, PromiseError]>({
    initialValue: null,
  });

  return createAtom<Depromisify<PromiseValue, PromiseError>>({
    getter: ({ get }) => {
      const promise = get(promiseAtom);

      return {
        state: 'pending',
        promise,
      };
    },
  });
};

const atom1 = createAtom<Depromisify<number>>({
  // initialValue: {
  //   state: 'pending',
  //   promise: new Promise<string>(() => {}),
  // },
  getter: () => ({
    state: 'pending',
    promise: new Promise<number>(() => {}),
  }),
});
