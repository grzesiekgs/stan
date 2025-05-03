import { FC } from 'react';
import { createDerivedAtom, createMutableAtom } from '@stan/core';
import { useSetAtomCallback, useSetAtomValue } from '@stan/react';
import { useRenderCount } from './useRenderCount';
import { PrintAtom } from './PrintAtom';

const aAtom = createMutableAtom(0);
const bAtom = createMutableAtom(0);
const switchAtom = createMutableAtom<'A' | 'B'>('A');

const aProxyAtom = createDerivedAtom(({ get }) => get(aAtom), undefined, {
  onObserve: () => {
    console.log('aProxy observed');
    return () => {
      console.log('aProxy unobserve');
    };
  },
});
const bProxyAtom = createDerivedAtom(({ get }) => get(bAtom), undefined, {
  storeLabel: 'bProxy',
  onObserve: () => {
    console.log('bProxy observed');

    return () => {
      console.log('bProxy unobserve');
    };
  },
});
const aTextAtom = createDerivedAtom(({ get }) => `A: ${get(aProxyAtom)}`, undefined, {
  storeLabel: 'aText',
});
const bTextAtom = createDerivedAtom(({ get }) => `B: ${get(bProxyAtom)}`, undefined, {
  storeLabel: 'bText',
});
const valueAtom = createDerivedAtom(
  ({ get }) => (get(switchAtom) === 'A' ? get(aTextAtom) : get(bTextAtom)),
  undefined,
  {
    storeLabel: 'value',
  }
);

export const MoutingTest: FC = () => {
  const setSwitchValue = useSetAtomValue(switchAtom);
  const setAValue = useSetAtomCallback(aAtom);
  const setBValue = useSetAtomCallback(bAtom);
  useRenderCount('MoutingTest');

  return (
    <div>
      <div>MoutingTest</div>
      <PrintAtom atom={valueAtom} />
      <div>
        <button onClick={() => setSwitchValue('A')}>A</button>
        <button onClick={() => setSwitchValue('B')}>B</button>
      </div>
      <div>
        <button onClick={() => setAValue((val) => val + 1)}>A+</button>
        <button onClick={() => setBValue((val) => val + 1)}>B+</button>
      </div>
    </div>
  );
};
