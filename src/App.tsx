import { SetStateAction, useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { createAtom } from './stan/atom/atom';
import { createStore } from './stan/store/store';
import { AnyAtom, Atom, MutableAtom, StatefulAtom } from './stan/types';
import './styles.css';
import { isMutableAtom, isStatefulAtom, isWritableAtom } from './stan/atom/utils';
import { testStore } from './testStore';
import { useAtom, useSetAtomValue } from './hooks';

const firstAtom = createAtom({
  label: 'first',
  initialValue: 1,
});

// const firstProxyAtom = createAtom({
//   label: 'firstProxy',
//   getter: ({ get }) => get(firstAtom),
// });

const secondAtom = createAtom({
  label: 'second',
  initialValue: 2,
});

const sumAtom = createAtom({
  label: 'sum',
  getter: ({ get }) => {
    return get(firstAtom) + get(secondAtom);
  },
});

const sumProxyAtom = createAtom({
  label: 'sumProxy',
  getter: ({ get }) => {
    return get(sumAtom);
  },
});

const firstPlusSumAtom = createAtom({
  label: 'fist+sum',
  getter: ({ get }) => {
    return get(firstAtom) + get(sumAtom);
  },
});

const firstPlusSumProxyAtom = createAtom({
  label: 'fist+sum Proxy',
  getter: ({ get }) => {
    return get(firstPlusSumAtom);
  },
});

const firstPlusPlusSumAtom = createAtom({
  label: 'first+sum+sum',
  getter: ({ get }) => {
    return get(firstAtom) + get(sumProxyAtom) + get(sumAtom);
  },
});

// const sumProxyProxyAtom = createAtom({
//   label: 'sumProxyProxy',
//   getter: ({ get }) => {
//     return get(sumProxyAtom);
//   },
// });

export default function App() {
  // const [mutable, setMutable] = useAtom(mutableAtom);
  const [first, setFirst] = useAtom(firstAtom);
  const [second, setSecond] = useAtom(secondAtom);
  // const [sum] = useAtom(sumProxyAtom);
  const [firstPlusSum] = useAtom(firstPlusPlusSumAtom);
  // const [second, setSecond] = useAtom(secondAtom);
  // const [sum] = useAtom(sumProxyAtom);
  // const [callback, setCallback] = useAtom(callbackAtom);

  console.warn('RENDER');
  return (
    <div className='App'>
      <div>first: {first}</div>
      <button onClick={() => setFirst((val) => val - 1)}>-</button>
      <button onClick={() => setFirst((val) => val + 1)}>+</button>
      <div>second: {second}</div>
      <button onClick={() => setSecond((val) => val - 1)}>-</button>
      <button onClick={() => setSecond((val) => val + 1)}>+</button>
      {/* <div>sum: {sum}</div> */}
      <div>first+sum: {firstPlusSum}</div>
    </div>
  );
}
