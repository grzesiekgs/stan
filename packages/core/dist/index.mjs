const D = (e, n) => n.value, C = (e, n) => n;
function p(e, n, o) {
  return {
    type: "mutable",
    initialValue: e,
    read: D,
    write: n ?? C,
    onObserve: o == null ? void 0 : o.onObserve,
    storeLabel: o == null ? void 0 : o.storeLabel
  };
}
function S(e, n, o) {
  return {
    type: "derived",
    read: e,
    write: n,
    onObserve: o == null ? void 0 : o.onObserve,
    storeLabel: o == null ? void 0 : o.storeLabel
  };
}
const y = (e) => ({
  type: "callback",
  write: e
}), M = (e) => {
  if (e === "mutable")
    return p;
  if (e === "derived")
    return S;
  if (e === "callback")
    return y;
  throw new Error(`Invalid atom type: ${e}`);
}, k = (e) => e.type === "mutable", P = (e) => e.type === "derived", F = (e) => e.type === "callback", Y = (e) => "read" in e, T = (e) => "write" in e;
var l = /* @__PURE__ */ ((e) => (e.FRESH = "fresh", e.STALE = "stale", e.PENDING = "pending", e))(l || {});
const O = (e) => {
  let n = null;
  const o = /* @__PURE__ */ new Set(), c = () => Promise.resolve().then(async () => {
    await e(o), o.clear(), n = null;
  });
  return {
    add: (d) => {
      o.add(d), n || (n = c());
    },
    delete: (d) => {
      o.delete(d);
    },
    has(d) {
      return o.has(d);
    },
    microtaskPromise: n
  };
}, U = Symbol("atomValueNotYetCalculcated"), I = (e) => k(e) ? {
  value: e.initialValue,
  dependencies: void 0,
  derivers: void 0,
  status: l.FRESH,
  isObserved: !1,
  onUnobserve: void 0
} : {
  value: U,
  dependencies: void 0,
  derivers: void 0,
  status: l.STALE,
  isObserved: !1,
  onUnobserve: void 0
}, u = (e, n) => {
  const o = n.get(e);
  if (o)
    return o;
  const c = I(e);
  return n.set(e, c), c;
}, g = (e, n) => {
  e.derivers || (e.derivers = /* @__PURE__ */ new Set()), e.derivers.add(n);
}, V = (e, n) => {
  var o, c;
  (o = e.derivers) == null || o.delete(n), !((c = e.derivers) != null && c.size) && (e.derivers = void 0);
}, H = (e, n) => {
  e.dependencies || (e.dependencies = /* @__PURE__ */ new Set()), e.dependencies.add(n);
}, G = () => {
  const e = /* @__PURE__ */ new WeakMap();
  window.showState = () => console.log(e);
  const n = O(
    (r) => {
      if (!r.size) {
        console.warn("SANITY CHECK IS ACTUALLY NECESSARY??");
        return;
      }
      const a = performance.now();
      r.forEach((s) => {
        u(s, e).isObserved && m(s);
      }), console.log("RECALCULATED", performance.now() - a);
    }
  ), o = O(
    async (r) => {
      await n.microtaskPromise;
      const a = (s) => {
        var A, E;
        const t = u(s, e);
        Array.from(t.derivers ?? []).some(
          (b) => u(b, e).isObserved
        ) || (console.log("UNOBSERVE", s.storeLabel, t.derivers), (A = t.onUnobserve) == null || A.call(t), t.isObserved = !1, (E = t.dependencies) == null || E.forEach(a));
      };
      r.forEach(a);
    }
  ), c = (r, a) => {
    var t;
    const s = u(r, e);
    if (s.status !== l.STALE && (s.status = a), n.has(r)) {
      Array.from(s.derivers ?? []).some(
        (i) => !n.has(i)
      ) && console.warn(
        "THIS SHOULD NOT HAPPEN! DERIVERS NOT CORRECTLY MARKED FOR RECALCULATION",
        r.storeLabel
      );
      return;
    }
    n.add(r), (t = s.derivers) == null || t.forEach(
      (i) => c(i, l.PENDING)
    );
  }, d = (r, a) => {
    var t;
    const s = u(r, e);
    s.status = l.FRESH, s.value !== a && ((t = s.derivers) == null || t.forEach(
      (i) => c(i, l.STALE)
    ), s.value = a, s.derivers = void 0);
  }, h = (r) => {
    var t;
    const a = u(r, e);
    if (a.isObserved || ((t = a.dependencies) == null || t.forEach(h), a.isObserved = !0, !r.onObserve))
      return;
    const s = T(r) ? r.onObserve({
      peek: v.peekAtom,
      // Consider allowing to set any atom within onObserve.
      setSelf: (i) => {
        v.setAtom(r, i);
      }
    }) : r.onObserve({ peek: v.peekAtom });
    s && (a.onUnobserve = s);
  }, f = (r, a, s) => {
    if (!a)
      return;
    (s ? a.difference(s) : a).forEach((i) => {
      const A = u(i, e);
      V(A, r), o.add(i);
    });
  }, m = (r, a) => {
    var E;
    const s = performance.now(), t = u(r, e);
    if (a && h(r), t.status === l.FRESH)
      return t.value;
    if (!P(r))
      throw new Error(
        "Somehow MutableAtom has been marked as not fresh! This shouldn`t be possible!"
      );
    if (t.status === l.PENDING && ((E = t.dependencies) == null || E.forEach((b) => m(b)), performance.now() - s > 1 && console.log("PENDING", performance.now() - s), t.status === l.PENDING))
      return t.status = l.FRESH, t.value;
    const i = t.dependencies;
    t.dependencies = void 0;
    const A = r.read(
      {
        get: (b) => {
          const N = m(b, t.isObserved), R = u(b, e);
          return H(t, b), g(R, r), N;
        },
        peek: v.peekAtom,
        // TODO Expose scheduleSet just for effect atom? (not introduced yet)
        scheduleSet: L
      },
      t
    );
    return f(r, i, t.dependencies), d(r, A), A;
  }, w = (r, a) => {
    const s = r.write({ peek: v.peekAtom, set: v.setAtom }, a);
    return k(r) && d(r, s), s;
  }, L = (r, a) => {
    Promise.resolve().then(() => w(r, a));
  }, v = {
    peekAtom: (r) => m(r),
    setAtom: w,
    observeAtom(r, a) {
      const s = S(
        ({ get: t }) => {
          const i = t(r);
          a(i);
        },
        void 0,
        {
          storeLabel: `observerOf[${r.storeLabel}]`
        }
      );
      return m(s, !0), () => {
        o.add(s), v.resetAtom(s);
      };
    },
    resetAtom(r) {
      console.log("RESET ATOM", r.storeLabel);
    }
  };
  return v;
}, Q = (e) => {
  const n = p({ state: "pending" }), o = S(({ get: c, scheduleSet: d }) => (c(e).then((f) => {
    d(n, {
      state: "resolved",
      value: f
    });
  }).catch((f) => {
    d(n, {
      state: "rejected",
      error: f
    });
  }), null));
  return S(({ get: c }) => (c(o), c(n)));
};
export {
  l as AtomStateStatus,
  M as createAtom,
  y as createCallbackAtom,
  S as createDerivedAtom,
  p as createMutableAtom,
  G as createStore,
  Q as depromisifyAtom,
  F as isCallbackAtom,
  P as isDerivedAtom,
  k as isMutableAtom,
  Y as isReadableAtom,
  T as isWritableAtom
};
