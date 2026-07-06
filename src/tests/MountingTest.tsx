import { FC } from 'react';
import { createDerivedAtom, createMutableAtom } from '../stan/atom/createAtom';
import { useAtomValue, useSetAtomCallback, useSetAtomValue } from '../hooks';
import { useRenderCount } from './useRenderCount';
import { PrintAtom } from './PrintAtom';

const switchAtom = createMutableAtom<'A' | 'B'>('A');
const aAtom = createMutableAtom(0, undefined, {
  storeLabel: 'A',
  onObserve: ({ peek, setSelf }) => {
    const currentValue = peek(aAtom);
    console.log('aAtom observed', currentValue);
    setSelf(currentValue + 10);

    return () => {
      console.log('aAtom unobserve');
    }
  },
});
const bAtom = createMutableAtom(0, undefined, {
  storeLabel: 'B',
  onObserve: ({ setSelf }) => {
    console.log('bAtom observed');

    return () => {
      setSelf(0);
      console.log('bAtom unobserve');
    }
  },
});
const aProxyAtom = createDerivedAtom(({ get }) => get(aAtom), undefined, {
  storeLabel: 'aProxy',
  onObserve: () => {
    console.log('aProxy observed');

    return () => {
      console.log('aProxy unobserve');
    }
  },
});
const bProxyAtom = createDerivedAtom(({ get }) => get(bAtom), undefined, {
  storeLabel: 'bProxy',
  onObserve: () => {
    console.log('bProxy observed');

    return () => {
      console.log('bProxy unobserve');
    }
  },
});
const aTextAtom = createDerivedAtom(({ get }) => `A: ${get(aProxyAtom)}`, undefined, {
  storeLabel: 'aText',
});
const bTextAtom = createDerivedAtom(({ get }) => `B: ${get(bProxyAtom)}`, undefined, {
  storeLabel: 'bText',
});
const valueAtom = createDerivedAtom(({ get }) => get(switchAtom) === 'A' ? get(aTextAtom) : get(bTextAtom), undefined, {
  storeLabel: 'value',
});

export const MoutingTest: FC = () => {
  const setSwitchValue = useSetAtomValue(switchAtom);
  const setAValue = useSetAtomCallback(aAtom);
  const setBValue = useSetAtomCallback(bAtom);
  const renderCount = useRenderCount('MoutingTest');

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
