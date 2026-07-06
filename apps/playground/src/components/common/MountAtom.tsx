import { ReadableAtom } from "@stan/core";
import { FC, useEffect } from "react";
import { useStore } from "../../../../../packages/react/src/context";

export type MountAtomProps = {
  atom: ReadableAtom<any>;
  label?: string;
};

export const MountAtom: FC<MountAtomProps> = ({ atom, label }) => { 
  const store = useStore();
  
  useEffect(() => {
    console.log(`MountAtom - ${label}`, atom);

    const unmount = store.observeAtomValue(atom, (value) => {
      console.log(`MountAtom observed - ${label}`, value);
    });

    return () => {
      console.log(`MountAtom - unmount - ${label}`, atom);
      unmount();
    };
  }, [store, atom, label]);

  return null;

}