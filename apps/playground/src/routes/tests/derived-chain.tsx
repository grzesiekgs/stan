import { createFileRoute } from '@tanstack/react-router';
import { FC } from 'react';
import { useSetAtomCallback } from '@stan/react';
import { createDerivedAtom, createMutableAtom, ReadableAtom } from '@stan/core';
import { PrintAtom } from '../../components/common/PrintAtom';

const createComplexChainAtom = (prevAtom: ReadableAtom<number>, depth: number) => {
  const first = createDerivedAtom(({ get }) => get(prevAtom), undefined, {
    storeLabel: `val1 - ${depth}`,
  });
  const second = createDerivedAtom(({ get }) => get(prevAtom), undefined, {
    storeLabel: `val2 - ${depth}`,
  });
  return createDerivedAtom(({ get }) => get(first) + get(second), undefined, {
    storeLabel: `${depth}`,
  });
};

const valueAtom = createMutableAtom(0, undefined, {
  storeLabel: 'root',
});
const deepth = 10;
const proxyAtom = new Array(deepth)
  .fill(null)
  .reduce<
    ReadableAtom<number>
  >((prevAtom, _, index) => createComplexChainAtom(prevAtom, index), valueAtom);

export const DerivedChainTest: FC = () => {
  const setValue = useSetAtomCallback(valueAtom);

  return (
    <div>
      <PrintAtom atom={proxyAtom} />
      <button onClick={() => setValue((val) => val - 1)}>-</button>
      <button onClick={() => setValue((val) => val + 1)}>+</button>
    </div>
  );
};

export const Route = createFileRoute('/tests/derived-chain')({
  component: DerivedChainTest,
});
