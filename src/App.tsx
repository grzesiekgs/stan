import { createAtom, createDerivedAtom, createMutableAtom } from './stan/atom/createAtom';
import './styles.css';
import { testStore, useAtomValue, useSetAtomCallback, useSetAtomValue } from './hooks';
import { FC, useRef, useState } from 'react';
import { ReadableAtom, WritableAtom } from './stan/types';

const firstAtom = createMutableAtom(1, undefined, {
  storeLabel: 'first',
  onObserve: () => {
    console.warn('FIRST OBSERVE');
  },
});

const firstProxyAtom = createDerivedAtom(
  ({ get }) => {
    return get(firstAtom);
  },
  ({ set }, update: string) => set(firstAtom, Number(update)),
  {
    storeLabel: 'first proxy',
    
  }
);

const secondAtom = createMutableAtom(2, undefined, {
  storeLabel: 'second',
});

const sumAtom = createDerivedAtom(
  ({ get }) => {
    return get(firstAtom) + get(secondAtom);
  },
  undefined,
  {
    storeLabel: 'first+second',
    onObserve: () => {
      console.warn('SUM OBSERVE');
    },
  }
);

const sumProxyAtom = createDerivedAtom(
  ({ get }) => {
    return get(sumAtom);
  },
  undefined,
  {
    storeLabel: 'first+second proxy',
  }
);

const firstPlusSumAtom = createDerivedAtom(
  ({ get }) => {
    return get(firstAtom) + get(sumAtom);
  },
  undefined,
  {
    storeLabel: 'fist+sum',
  }
);

const firstPlusSumProxyAtom = createDerivedAtom(
  ({ get }) => {
    return get(firstPlusSumAtom);
  },
  undefined,
  {
    storeLabel: '"fist+sum" proxy',
  }
);

const firstPlusPlusSumAtom = createDerivedAtom(
  ({ get }) => {
    return get(firstAtom) + get(sumProxyAtom) + get(sumAtom);
  },
  undefined,
  {
    storeLabel: '"first+sum"+sumProxy',
    onObserve: () => {
      console.warn('FIRST ASDASD OBSERVE');
    },
  }
);

// testStore.observeAtom(firstPlusPlusSumAtom, (val) => {
//   console.log('>>>>', val)
// });

type PrintAtomProps = {
  atom: ReadableAtom<any, any>;
};

const PrintAtom: FC<PrintAtomProps> = ({ atom }) => {
  const value = useAtomValue(atom);

  return (
    <div>
      {atom.storeLabel}: {value}
    </div>
  );
};

export default function App() {
  const renderCount = useRef(0);
  // const [mutable, setMutable] = useAtom(mutableAtom);
  // const first = useAtomValue(firstAtom);
  // const firstProxy = useAtomValue(firstProxyAtom);
  //const setFirst = useSetAtomCallback(firstAtom);
  const setFirstProxy = useSetAtomCallback(firstProxyAtom);

  // const second = useAtomValue(secondAtom);
  // const setSecond = useSetAtomCallback(secondAtom);
  // const sum = useAtomValue(sumAtom);
  // const sumProxy = useAtomValue(sumProxyAtom);
  // const firstPlusSum = useAtomValue(firstPlusSumAtom);
  // const firstPlusSumProxy = useAtomValue(firstPlusSumProxyAtom);
  // const firstPlusPlusSum = useAtomValue(firstPlusPlusSumAtom);
  console.warn('RENDER', ++renderCount.current);

  return (
    <div className='App'>
      {/* <div>first: {first}</div> */}
      {/* <PrintAtom atom={firstAtom} /> */}
      <PrintAtom atom={firstPlusPlusSumAtom} />
      <button onClick={() => setFirstProxy((val) => String(val - 1))}>-</button>
      <button onClick={() => setFirstProxy((val) => String(val + 1))}>+</button>
      {/* <button onClick={() => setFirstProxy((val) => String(val - 1))}>-</button>
      <button onClick={() => setFirstProxy((val) => String(val + 1))}>+</button>
      <div>second: {second}</div>
      <button onClick={() => setSecond((val) => val - 1)}>-</button>
      <button onClick={() => setSecond((val) => val + 1)}>+</button>
      
      <div>sum: {sum} / {sumProxy}</div>
      <div>first+sum: {firstPlusSum} / {firstPlusSumProxy}</div>
      <div>"first+sum"+sum: {firstPlusPlusSum}</div> */}
    </div>
  );
}
