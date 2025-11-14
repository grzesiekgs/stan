import { ReadableAtom } from "@stan/core";
import { FC, useEffect } from "react";
import { useStore } from "../../../../packages/react/src/context";

export const MountAtom: FC<{ atom: ReadableAtom<any> }> = ({ atom }) => { 
  const store = useStore();
  
  useEffect(() => {
    console.log('MountAtom', atom);
    return store.observeAtomValue(atom, (value) => {
      console.log('MountAtom observed', value);
    });

    
  }, [store, atom]);

  return null;

}