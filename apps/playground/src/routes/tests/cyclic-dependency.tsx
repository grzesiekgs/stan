import { createDerivedAtom, createMutableAtom, createObserverAtom } from '@stan/core';
import { FC, useState } from 'react';
import { PrintAtom } from '../../components/common/PrintAtom';
import { useSetAtomCallback } from '@stan/react';
import { createFileRoute } from '@tanstack/react-router';

const valueAtom = createMutableAtom(0, undefined, {
  storeLabel: 'root',
});

const derivedAtom = createDerivedAtom<number>(
  ({ get, scheduleSet }) => {
    const value = get(valueAtom);
    const nextValue = value + 1;
    console.log('DERIVED SCHEDULE SET', nextValue);
    
      scheduleSet(valueAtom, nextValue)
    

    return value;
  },
  undefined,
  {
    storeLabel: 'derived',
  }
);

const observerAtom = createObserverAtom(({ get, scheduleSet }) => {
  const value = get(valueAtom);
  const nextValue = value + 1;
  console.log('OBSERVER SCHEDULE SET', nextValue);

  scheduleSet(valueAtom, nextValue)

  return value;
});

export const CyclicDependencyTest: FC = () => {
  const setValue = useSetAtomCallback(valueAtom);
  const [mountDerived, setMountDerived] = useState(false);
  const [mountObserver, setMountObserver] = useState(false);

  return (
    <div>
      <div>CyclicDependencyTest</div>
      <button onClick={() => setValue((val) => val + 1)}>Increment</button>
      <button onClick={() => setValue((val) => val - 1)}>Decrement</button>
      <br />
      <button onClick={() => setMountDerived((prev) => !prev)}>
        {mountDerived ? 'Unmount Derived' : 'Mount Derived'}
      </button>
      <button onClick={() => setMountObserver((prev) => !prev)}>
        {mountObserver ? 'Unmount Observer' : 'Mount Observer'}
      </button>

      {mountDerived && <PrintAtom atom={derivedAtom} />}
      {mountObserver && <PrintAtom atom={observerAtom} />}
    </div>
  );
};

export const Route = createFileRoute('/tests/cyclic-dependency')({
  component: CyclicDependencyTest,
});
