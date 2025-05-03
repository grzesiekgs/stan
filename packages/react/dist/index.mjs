import { useMemo as c, useSyncExternalStore as a, useCallback as s } from "react";
import { createStore as i, isWritableAtom as u, isReadableAtom as l } from "@stan/core";
const o = i(), m = (e) => [
  (t) => o.observeAtom(e, t),
  () => o.peekAtom(e)
], d = (e) => {
  const [t, r] = c(
    () => m(e),
    [e]
  );
  return a(t, r);
}, f = (e) => {
  if (!u(e))
    throw new Error("Tried to write non-writable atom");
  return s(
    (t) => o.setAtom(e, t),
    [e]
  );
};
function k(e) {
  if (!u(e))
    throw new Error("Tried to write non-writable atom");
  return s(
    (t) => {
      const r = l(e) ? o.peekAtom(e) : void 0, n = t(r);
      return o.setAtom(e, n);
    },
    [e]
  );
}
export {
  o as testStore,
  d as useAtomValue,
  k as useSetAtomCallback,
  f as useSetAtomValue
};
