import { useMemo as a, useSyncExternalStore as c, useCallback as n } from "react";
import { createStore as l, isWritableAtom as s, isReadableAtom as i } from "@stan/core";
const o = l(), m = (e) => [
  (t) => o.observeAtomValue(e, t),
  () => o.peekAtomValue(e)
], p = (e) => {
  const [t, r] = a(
    () => m(e),
    [e]
  );
  return c(t, r);
}, d = (e) => {
  if (!s(e))
    throw new Error("Tried to write non-writable atom");
  return n(
    (t) => o.setAtomValue(e, t),
    [e]
  );
};
function f(e) {
  if (!s(e))
    throw new Error("Tried to write non-writable atom");
  return n(
    (t) => {
      const r = i(e) ? o.peekAtomValue(e) : void 0, u = t(r);
      return o.setAtomValue(e, u);
    },
    [e]
  );
}
export {
  o as testStore,
  p as useAtomValue,
  f as useSetAtomCallback,
  d as useSetAtomValue
};
