import { createFileRoute } from '@tanstack/react-router'
import { FC } from 'react';
import { createDerivedAtom, createMutableAtom } from '@stan/core';
import { useSetAtomCallback } from '@stan/react';
import { PrintAtom } from '../../components/common/PrintAtom';


const firstAtom = createMutableAtom(1, undefined, {
  storeLabel: 'first',
  onObserve: () => {
    console.warn('FIRST OBSERVE');
  },
});

const firstProxyAtom = createDerivedAtom(
  ({ get }) => get(firstAtom),
  ({ set }, update: string) => {
    set(firstAtom, Number(update));
  },
  {
    onObserve: () => {
      console.log('firstProxy observed');
      return () => {
        console.log('firstProxy unobserve');
      };
    },
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
    storeLabel: 'sum',
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
    storeLabel: 'sum proxy',
  }
);

// const firstPlusSumAtom = createDerivedAtom(
//   ({ get }) => {
//     return get(firstAtom) + get(sumAtom);
//   },
//   undefined,
//   {
//     storeLabel: 'first+sum',
//   }
// );

// const firstPlusSumProxyAtom = createDerivedAtom(
//   ({ get }) => {
//     return get(firstPlusSumAtom);
//   },
//   undefined,
//   {
//     storeLabel: 'first+sum proxy',
//   }
// );

const firstPlusPlusSumAtom = createDerivedAtom(
  ({ get }) => {
    return get(firstAtom) + get(sumProxyAtom) + get(sumAtom);
  },
  undefined,
  {
    storeLabel: 'first+sum + sumProxy',
    onObserve: () => {
      console.warn('FIRST ASDASD OBSERVE');
    },
  }
);

// testStore.observeAtom(firstPlusPlusSumAtom, (val) => {
//   console.log('>>>>', val)
// });

export const ProxyTest: FC = () => {
  // const renderCount = useRenderCount('ProxyTest');
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

  return (
    <div className="App">
      {/* <div>first: {first}</div> */}
      <PrintAtom atom={firstAtom} />
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
};


export const Route = createFileRoute('/tests/proxy')({
  component: ProxyTest,
});
