const R = (e, r) => r.value, C = (e, r) => r;
function w(e, r, s) {
  return {
    type: "mutable",
    initialValue: e,
    read: R,
    write: r ?? C,
    onObserve: s == null ? void 0 : s.onObserve,
    storeLabel: s == null ? void 0 : s.storeLabel
  };
}
function S(e, r, s) {
  return {
    type: "derived",
    read: e,
    write: r,
    onObserve: s == null ? void 0 : s.onObserve,
    storeLabel: s == null ? void 0 : s.storeLabel
  };
}
function k(e) {
  return {
    type: "observer",
    // Make sure to ignore return value of `read`.
    read: (...r) => {
      e(...r);
    }
  };
}
const P = (e) => ({
  type: "callback",
  write: e
}), G = (e) => {
  if (e === "mutable")
    return w;
  if (e === "derived")
    return S;
  if (e === "observer")
    return k;
  if (e === "callback")
    return P;
  throw new Error(`Invalid atom type: ${e}`);
}, N = (e) => e.type === "mutable", T = (e) => e.type === "derived", U = (e) => e.type === "observer", y = (e) => T(e) || U(e), Q = (e) => e.type === "callback", W = (e) => "read" in e, g = (e) => "write" in e;
var l = /* @__PURE__ */ ((e) => (e.FRESH = "fresh", e.STALE = "stale", e.PENDING = "pending", e))(l || {});
const h = (e) => {
  let r = null;
  const s = /* @__PURE__ */ new Set(), d = () => Promise.resolve().then(async () => {
    await e(s), s.clear(), r = null;
  });
  return {
    add: (i) => {
      s.add(i), r || (r = d());
    },
    delete: (i) => {
      s.delete(i);
    },
    has(i) {
      return s.has(i);
    },
    microtaskPromise: r
  };
}, I = Symbol("atomValueNotYetCalculcated"), H = (e) => N(e) ? {
  value: e.initialValue,
  dependencies: void 0,
  dependents: void 0,
  status: l.FRESH,
  isObserved: !1,
  onUnobserve: void 0
} : {
  value: I,
  dependencies: void 0,
  dependents: void 0,
  status: l.STALE,
  isObserved: !1,
  onUnobserve: void 0
}, u = (e, r) => {
  const s = r.get(e);
  if (s)
    return s;
  const d = H(e);
  return r.set(e, d), d;
}, M = (e, r) => {
  e.dependents || (e.dependents = /* @__PURE__ */ new Set()), e.dependents.add(r);
}, F = (e, r) => {
  var s, d;
  (s = e.dependents) == null || s.delete(r), !((d = e.dependents) != null && d.size) && (e.dependents = void 0);
}, Y = (e, r) => {
  e.dependencies || (e.dependencies = /* @__PURE__ */ new Set()), e.dependencies.add(r);
}, z = () => {
  const e = /* @__PURE__ */ new WeakMap();
  window.showState = () => console.log(e);
  const r = h(
    (t) => {
      if (!t.size) {
        console.warn("SANITY CHECK IS ACTUALLY NECESSARY??");
        return;
      }
      const a = performance.now();
      t.forEach((o) => {
        u(o, e).isObserved && m(o);
      }), console.log("RECALCULATED", performance.now() - a);
    }
  ), s = h(async (t) => {
    await r.microtaskPromise;
    const a = (o) => {
      var A, p;
      const n = u(o, e);
      Array.from(n.dependents ?? []).some(
        (b) => u(b, e).isObserved
      ) || (console.log("UNOBSERVE atom", o.storeLabel, n.dependents), (A = n.onUnobserve) == null || A.call(n), n.isObserved = !1, (p = n.dependencies) == null || p.forEach(a));
    };
    t.forEach(a);
  }), d = (t, a) => {
    var n;
    const o = u(t, e);
    if (o.status !== l.STALE && (o.status = a), r.has(t)) {
      Array.from(o.dependents ?? []).some(
        (c) => !r.has(c)
      ) && console.warn(
        "THIS SHOULD NOT HAPPEN! DEPENDENTS NOT CORRECTLY MARKED FOR RECALCULATION",
        t.storeLabel
      );
      return;
    }
    r.add(t), (n = o.dependents) == null || n.forEach(
      (c) => d(c, l.PENDING)
    );
  }, i = (t, a) => {
    var n;
    const o = u(t, e);
    o.status = l.FRESH, o.value !== a && ((n = o.dependents) == null || n.forEach(
      (c) => d(c, l.STALE)
    ), o.value = a, o.dependents = void 0);
  }, E = (t) => {
    var n;
    const a = u(t, e);
    if (a.isObserved || ((n = a.dependencies) == null || n.forEach(E), a.isObserved = !0, !t.onObserve))
      return;
    const o = g(t) ? t.onObserve({
      peek: v.peekAtomValue,
      // Consider allowing to set any atom within onObserve.
      setSelf: (c) => {
        v.setAtomValue(t, c);
      }
    }) : t.onObserve({ peek: v.peekAtomValue });
    o && (a.onUnobserve = o);
  }, f = (t, a, o) => {
    if (!a)
      return;
    (o ? a.difference(o) : a).forEach((c) => {
      const A = u(c, e);
      F(A, t), s.add(c);
    });
  }, m = (t, a) => {
    var p;
    const o = performance.now(), n = u(t, e);
    if (a && E(t), n.status === l.FRESH)
      return n.value;
    if (!y(t))
      throw new Error(
        `Somehow MutableAtom has been marked as not fresh! This shouldn't be possible! - ${t.storeLabel}`
      );
    if (n.status === l.PENDING && ((p = n.dependencies) == null || p.forEach((b) => m(b)), performance.now() - o > 1 && console.log("PENDING", performance.now() - o), n.status === l.PENDING))
      return n.status = l.FRESH, n.value;
    const c = n.dependencies;
    n.dependencies = void 0;
    const A = t.read(
      {
        get: (b) => {
          const D = m(b, n.isObserved), V = u(b, e);
          return Y(n, b), M(V, t), D;
        },
        peek: v.peekAtomValue,
        // TODO Expose scheduleSet just for observer atom? (not introduced yet)
        scheduleSet: L
      },
      n
    );
    return f(t, c, n.dependencies), i(t, A), A;
  }, O = (t, a) => {
    const o = t.write({ peek: v.peekAtomValue, set: v.setAtomValue }, a);
    return N(t) && i(t, o), o;
  }, L = (t, a) => {
    Promise.resolve().then(() => O(t, a));
  }, v = {
    peekAtomValue: (t) => m(t),
    setAtomValue: O,
    getAtomState: (t) => u(t, e),
    observeAtomValue(t, a) {
      const o = k(({ get: n }) => {
        const c = n(t);
        a(c);
      });
      return m(o, !0), () => {
        s.add(o);
      };
    },
    resetAtomState(t) {
      console.log("RESET ATOM", t.storeLabel);
    }
  };
  return v;
}, K = (e) => {
  const r = w({ state: "pending" }), s = S(({ get: d, scheduleSet: i }) => (d(e).then((f) => {
    i(r, {
      state: "resolved",
      value: f
    });
  }).catch((f) => {
    i(r, {
      state: "rejected",
      error: f
    });
  }), null));
  return S(({ get: d }) => (d(s), d(r)));
};
export {
  l as AtomStateStatus,
  G as createAtom,
  P as createCallbackAtom,
  S as createDerivedAtom,
  w as createMutableAtom,
  k as createObserverAtom,
  z as createStore,
  K as depromisifyAtom,
  Q as isCallbackAtom,
  y as isDependentAtom,
  T as isDerivedAtom,
  N as isMutableAtom,
  U as isObserverAtom,
  W as isReadableAtom,
  g as isWritableAtom
};
