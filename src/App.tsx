import { createAtom, createDerivedAtom, createMutableAtom } from './stan/createAtom/createAtom';
import './styles.css';
import { useAtomValue, useSetAtomCallback, useSetAtomValue } from './hooks';
import { useRef, useState } from 'react';

const firstAtom = createMutableAtom(1, undefined, {
  storeLabel: 'first'
})
  
// const firstProxyAtom = createAtom({
//   label: 'firstProxy',
//   getter: ({ get }) => get(firstAtom),
// });

const secondAtom = createMutableAtom(2, undefined, {
  storeLabel: 'second'
})

const sumAtom = createDerivedAtom(({ get }) => {
  return get(firstAtom) + get(secondAtom);
}, undefined, {
  storeLabel: 'first+second',
});

const sumProxyAtom = createDerivedAtom(({ get }) => {
  return get(sumAtom);
}, undefined, {
  storeLabel: 'first+second proxy',
});

const firstPlusSumAtom = createDerivedAtom(({ get }) => {
  return get(firstAtom) + get(sumAtom);
}, undefined, {
  storeLabel: 'fist+sum',
});

const firstPlusSumProxyAtom = createDerivedAtom(({ get }) => {
  return get(firstPlusSumAtom);
}, undefined, {
  storeLabel: '"fist+sum" proxy',
});

const firstPlusPlusSumAtom = createDerivedAtom(({ get }) => {
  return get(firstAtom) + get(sumProxyAtom) + get(sumAtom);
}, undefined, {
  storeLabel: '"first+sum"+sumProxy',
});
  
// const sumProxyProxyAtom = createAtom({
//   label: 'sumProxyProxy',
//   getter: ({ get }) => {
//     return get(sumProxyAtom);
//   },
// });

export default function App() {
  const renderCount = useRef(0);
  // const [mutable, setMutable] = useAtom(mutableAtom);
  const first = useAtomValue(firstAtom);
  const setFirst = useSetAtomCallback(firstAtom);
  const second = useAtomValue(secondAtom);
  const setSecond = useSetAtomCallback(secondAtom);
  const sum = useAtomValue(sumAtom);
  const sumProxy = useAtomValue(sumProxyAtom);
  const firstPlusSum = useAtomValue(firstPlusSumAtom);
  const firstPlusSumProxy = useAtomValue(firstPlusSumProxyAtom);
  const firstPlusPlusSum = useAtomValue(firstPlusPlusSumAtom);
  console.warn('RENDER', ++renderCount.current);
  
  return (
    <div className='App'>
      <div>first: {first}</div>
      <button onClick={() => setFirst((val) => val - 1)}>-</button>
      <button onClick={() => setFirst((val) => val + 1)}>+</button>
      <div>second: {second}</div>
      <button onClick={() => setSecond((val) => val - 1)}>-</button>
      <button onClick={() => setSecond((val) => val + 1)}>+</button>
      {/* <div>sum: {sum}</div> */}
      <div>sum: {sum} / {sumProxy}</div>
      <div>first+sum: {firstPlusSum} / {firstPlusSumProxy}</div>
      <div>"first+sum"+sum: {firstPlusPlusSum}</div>
    </div>
  );
}
