import { SetStateAction, useCallback, useMemo, useSyncExternalStore } from 'react';
import { createAtom } from './stan/atom/atom';
import { createStore } from './stan/store/store';
import { AnyAtom, Atom, MutableAtom, StatefulAtom } from './stan/types';
import './styles.css';
import { isMutableAtom, isStatefulAtom, isWritableAtom } from './stan/atom/utils';
import { testStore } from './testStore';
import { useAtom, useSetAtomValue } from './hooks';

const mutableAtom = createAtom({
  label: 'mutable',
  initialValue: 0,
});

const derivedAtom = createAtom({
  label: 'derived',
  getter: ({ get }) => {
    return get(mutableAtom) * 2;
  },
});

const callbackAtom = createAtom({
  setter: ({ set }, update: string) => set(mutableAtom, Number(update)),
});

// testStore.observeAtom(mutableAtom, (update) => {
//   console.log('APP MUTABLE OBSERVER', update);
// });

testStore.observeAtom(derivedAtom, (update) => {
  console.log('APP DERIVED OBSERVER', update);
});

export default function App() {
  // const [mutable, setMutable] = useAtom(mutableAtom);
  const setMutable = useSetAtomValue(mutableAtom);
  const [derived, setDerived] = useAtom(derivedAtom);
  // const [callback, setCallback] = useAtom(callbackAtom);

  return (
    <div className='App'>
      <button onClick={() => setMutable((val) => val - 1)}>-</button>
      <button onClick={() => setMutable((val) => val + 1)}>+</button>
      <div>derived: {derived}</div>
      {/* <div>derived: {derived}</div> */}
    </div>
  );
}
