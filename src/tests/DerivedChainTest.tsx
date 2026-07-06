import { FC } from 'react';
import { useAtomValue, useSetAtomCallback } from '../hooks';
import { createDerivedAtom, createMutableAtom } from '../stan/atom/createAtom';
import { ReadableAtom } from '../stan/types';
import { PrintAtom } from './PrintAtom';

const createSimpleChainAtom = (prevAtom: ReadableAtom<number>) => createDerivedAtom(({ get }) => get(prevAtom));

const createComplexChainAtom = (prevAtom: ReadableAtom<number>) => {
  const first = createDerivedAtom(({ get }) => get(prevAtom));
  const second = createDerivedAtom(({ get }) => get(prevAtom));
  const sum = createDerivedAtom(({ get }) => get(first) + get(second));
  const zonk = createDerivedAtom(({ get }) => get(sum) / 2);

  return createDerivedAtom(({ get }) => get(zonk));
};

const valueAtom = createMutableAtom(0);
const deepth = 550;
const proxyAtom = new Array(deepth)
  .fill(null)
  .reduce<ReadableAtom<number>>(
    createComplexChainAtom,
    valueAtom
  );

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
