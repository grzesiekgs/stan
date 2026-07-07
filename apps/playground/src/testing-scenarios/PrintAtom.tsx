import { FC } from 'react';
import { useAtomValue } from '@stan/react';
import { GattableAtom } from '@stan/core';

export const PrintAtom: FC<{ atom: GattableAtom<any> }> = ({ atom }) => {
  const value = useAtomValue(atom);
  return <div>{JSON.stringify(value)}</div>;
};
