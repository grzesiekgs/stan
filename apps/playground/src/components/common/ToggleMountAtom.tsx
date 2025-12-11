import { ReadableAtom } from "@stan/core";
import { FC, useState } from "react";
import { MountAtom } from "./MountAtom";

export type ToggleMountAtomProps = {
  atom: ReadableAtom<unknown>;
  label?: string;
  defaultIsMounted?: boolean;
};

export const ToggleMountAtom: FC<ToggleMountAtomProps> = ({ atom, label, defaultIsMounted = false }) => {
  const [isMounted, setIsMounted] = useState(defaultIsMounted);


  return (
    <div>
      <button onClick={() => setIsMounted((currentIsMounted) => !currentIsMounted)}>
        {isMounted ? 'Unmount' : 'Mount'} - {label}
      </button>
      {isMounted ? <MountAtom atom={atom} /> : null}
    </div>
  );
};