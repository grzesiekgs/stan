import { createDerivedAtom, createMutableAtom, isReadableValueCalculated } from "@stan/core";
import { FC, useState } from "react";
import { PrintAtom } from "./PrintAtom";
import { useSetAtomCallback } from "@stan/react";

const valueAtom = createMutableAtom(0, undefined, {
  storeLabel: 'root',
});

const derivedAtom = createDerivedAtom<number>(({ get, scheduleSet }, lastValue) => {
  const value = isReadableValueCalculated(lastValue) ? lastValue : get(valueAtom);
  const nextValue = value + 1;
  
  scheduleSet(valueAtom, nextValue);
  
  return value;
}, undefined, {
  storeLabel: 'derived',
});

const observerAtom = createDerivedAtom<number>(
  ({ get, scheduleSet }, lastValue) => {
    const value = isReadableValueCalculated(lastValue) ? lastValue : get(valueAtom);
    const nextValue = value + 1;

    scheduleSet(valueAtom, nextValue);

    return value;
  },
  undefined,
  {
    storeLabel: 'observer',
  }
);


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
      <button onClick={() => setMountDerived((prev) => !prev)}>{mountDerived ? 'Unmount Derived' : 'Mount Derived'}</button>
      <button onClick={() => setMountObserver((prev) => !prev)}>{mountObserver ? 'Unmount Observer' : 'Mount Observer'}</button>

      {mountDerived && <PrintAtom atom={derivedAtom} />}
      {mountObserver && <PrintAtom atom={observerAtom} />}
    </div>
  );
};