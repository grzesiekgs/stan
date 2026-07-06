import { createDerivedAtom, createMutableAtom, ReadAtom } from '@stan/core';
import { useAtomValue } from '@stan/core';

export function DerivedChainTest() {
  const baseAtom = createMutableAtom<number>(1);
  const derived1 = createDerivedAtom<number, number>(baseAtom as ReadAtom<number>, (value: number) => value * 2);
  const derived2 = createDerivedAtom<number, number>(derived1 as ReadAtom<number>, (value: number) => value * 2);
  const value = useAtomValue(derived2);

  return <div>Derived Chain Test: {value}</div>;
} 