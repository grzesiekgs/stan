import { GattableAtom } from '@stan/core';
import { FC, useEffect } from 'react';
import { useStore } from '@stan/react';

export const MountAtom: FC<{ atom: GattableAtom<any> }> = ({ atom }) => {
  const store = useStore();

  useEffect(() => {
    console.log('MountAtom', atom);
    return store.observeAtomValue(atom, (value) => {
      console.log('MountAtom observed', value);
    });
  }, [store, atom]);

  return null;
};
