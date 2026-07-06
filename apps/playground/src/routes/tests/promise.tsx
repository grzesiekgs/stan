import { createDerivedAtom, createMutableAtom } from '@stan/core';
import { useAtomValue, useSetAtomCallback } from '@stan/react';
import { createFileRoute } from '@tanstack/react-router';
import { FC, Suspense } from 'react';

const countAtom = createMutableAtom(1);
const promiseCountAtom = createDerivedAtom(({ get }) => {
  const count = get(countAtom);

  return new Promise<number>((resolve) => {
    setTimeout(() => resolve(count), 500);
  });
});

const Loader: FC = () => {
  return <div>Loading...</div>;
};

const Component: FC = () => {
  const value = useAtomValue(promiseCountAtom);

  return <div>Count: {value}</div>;
};

const PromiseTest: FC = () => {
  const setCount = useSetAtomCallback(countAtom);
  return (
    <>
      <Suspense fallback={<Loader />}>
        <Component />
      </Suspense>
      <button
        onClick={() => {
          setCount((currentCount) => {
            return currentCount + 1;
          });
        }}
      >
        +
      </button>
    </>
  );
};

export const Route = createFileRoute('/tests/promise')({
  component: PromiseTest,
});
