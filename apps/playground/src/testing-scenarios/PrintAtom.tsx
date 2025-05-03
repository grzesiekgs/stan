import { FC } from 'react';
import { useAtomValue } from '@stan/react';
import { ReadableAtom } from '@stan/core';

export const PrintAtom: FC<{ atom: ReadableAtom<any> }> = ({ atom }) => {
  const value = useAtomValue(atom);
  return <div>{JSON.stringify(value)}</div>;
};
