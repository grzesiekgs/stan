import { FC } from "react";
import { useAtomValue } from "../hooks";
import { ReadableAtom } from "../stan/types";

export type PrintAtomProps = {
  atom: ReadableAtom<any, any>;
};

export const PrintAtom: FC<PrintAtomProps> = ({ atom }) => {
  const value = useAtomValue(atom);

  return (
    <div>
      {atom.storeLabel}: {value}
    </div>
  );
};