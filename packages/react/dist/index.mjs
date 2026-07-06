import ae, { createContext as se, useState as ue, useContext as ce, useEffect as le, useMemo as ie, useSyncExternalStore as fe, use as de, useCallback as M } from "react";
import { createStore as me, isReadableAtom as W, isWritableAtom as L } from "@stan/core";
var _ = { exports: {} }, R = {};
/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var $;
function Ee() {
  if ($) return R;
  $ = 1;
  var t = Symbol.for("react.transitional.element"), o = Symbol.for("react.fragment");
  function c(f, a, l) {
    var E = null;
    if (l !== void 0 && (E = "" + l), a.key !== void 0 && (E = "" + a.key), "key" in a) {
      l = {};
      for (var b in a)
        b !== "key" && (l[b] = a[b]);
    } else l = a;
    return a = l.ref, {
      $$typeof: t,
      type: f,
      key: E,
      ref: a !== void 0 ? a : null,
      props: l
    };
  }
  return R.Fragment = o, R.jsx = c, R.jsxs = c, R;
}
var v = {};
/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var F;
function be() {
  return F || (F = 1, process.env.NODE_ENV !== "production" && (function() {
    function t(e) {
      if (e == null) return null;
      if (typeof e == "function")
        return e.$$typeof === te ? null : e.displayName || e.name || null;
      if (typeof e == "string") return e;
      switch (e) {
        case p:
          return "Fragment";
        case X:
          return "Profiler";
        case G:
          return "StrictMode";
        case Q:
          return "Suspense";
        case K:
          return "SuspenseList";
        case re:
          return "Activity";
      }
      if (typeof e == "object")
        switch (typeof e.tag == "number" && console.error(
          "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
        ), e.$$typeof) {
          case J:
            return "Portal";
          case H:
            return (e.displayName || "Context") + ".Provider";
          case B:
            return (e._context.displayName || "Context") + ".Consumer";
          case Z:
            var r = e.render;
            return e = e.displayName, e || (e = r.displayName || r.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
          case ee:
            return r = e.displayName || null, r !== null ? r : t(e.type) || "Memo";
          case j:
            r = e._payload, e = e._init;
            try {
              return t(e(r));
            } catch {
            }
        }
      return null;
    }
    function o(e) {
      return "" + e;
    }
    function c(e) {
      try {
        o(e);
        var r = !1;
      } catch {
        r = !0;
      }
      if (r) {
        r = console;
        var n = r.error, s = typeof Symbol == "function" && Symbol.toStringTag && e[Symbol.toStringTag] || e.constructor.name || "Object";
        return n.call(
          r,
          "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
          s
        ), o(e);
      }
    }
    function f(e) {
      if (e === p) return "<>";
      if (typeof e == "object" && e !== null && e.$$typeof === j)
        return "<...>";
      try {
        var r = t(e);
        return r ? "<" + r + ">" : "<...>";
      } catch {
        return "<...>";
      }
    }
    function a() {
      var e = S.A;
      return e === null ? null : e.getOwner();
    }
    function l() {
      return Error("react-stack-top-frame");
    }
    function E(e) {
      if (y.call(e, "key")) {
        var r = Object.getOwnPropertyDescriptor(e, "key").get;
        if (r && r.isReactWarning) return !1;
      }
      return e.key !== void 0;
    }
    function b(e, r) {
      function n() {
        C || (C = !0, console.error(
          "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
          r
        ));
      }
      n.isReactWarning = !0, Object.defineProperty(e, "key", {
        get: n,
        configurable: !0
      });
    }
    function q() {
      var e = t(this.type);
      return N[e] || (N[e] = !0, console.error(
        "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
      )), e = this.props.ref, e !== void 0 ? e : null;
    }
    function z(e, r, n, s, d, i, w, A) {
      return n = i.ref, e = {
        $$typeof: g,
        type: e,
        key: r,
        props: i,
        _owner: d
      }, (n !== void 0 ? n : null) !== null ? Object.defineProperty(e, "ref", {
        enumerable: !1,
        get: q
      }) : Object.defineProperty(e, "ref", { enumerable: !1, value: null }), e._store = {}, Object.defineProperty(e._store, "validated", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: 0
      }), Object.defineProperty(e, "_debugInfo", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: null
      }), Object.defineProperty(e, "_debugStack", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: w
      }), Object.defineProperty(e, "_debugTask", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: A
      }), Object.freeze && (Object.freeze(e.props), Object.freeze(e)), e;
    }
    function x(e, r, n, s, d, i, w, A) {
      var u = r.children;
      if (u !== void 0)
        if (s)
          if (ne(u)) {
            for (s = 0; s < u.length; s++)
              h(u[s]);
            Object.freeze && Object.freeze(u);
          } else
            console.error(
              "React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead."
            );
        else h(u);
      if (y.call(r, "key")) {
        u = t(e);
        var m = Object.keys(r).filter(function(oe) {
          return oe !== "key";
        });
        s = 0 < m.length ? "{key: someKey, " + m.join(": ..., ") + ": ...}" : "{key: someKey}", I[u + s] || (m = 0 < m.length ? "{" + m.join(": ..., ") + ": ...}" : "{}", console.error(
          `A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`,
          s,
          u,
          m,
          u
        ), I[u + s] = !0);
      }
      if (u = null, n !== void 0 && (c(n), u = "" + n), E(r) && (c(r.key), u = "" + r.key), "key" in r) {
        n = {};
        for (var O in r)
          O !== "key" && (n[O] = r[O]);
      } else n = r;
      return u && b(
        n,
        typeof e == "function" ? e.displayName || e.name || "Unknown" : e
      ), z(
        e,
        u,
        i,
        d,
        a(),
        n,
        w,
        A
      );
    }
    function h(e) {
      typeof e == "object" && e !== null && e.$$typeof === g && e._store && (e._store.validated = 1);
    }
    var T = ae, g = Symbol.for("react.transitional.element"), J = Symbol.for("react.portal"), p = Symbol.for("react.fragment"), G = Symbol.for("react.strict_mode"), X = Symbol.for("react.profiler"), B = Symbol.for("react.consumer"), H = Symbol.for("react.context"), Z = Symbol.for("react.forward_ref"), Q = Symbol.for("react.suspense"), K = Symbol.for("react.suspense_list"), ee = Symbol.for("react.memo"), j = Symbol.for("react.lazy"), re = Symbol.for("react.activity"), te = Symbol.for("react.client.reference"), S = T.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, y = Object.prototype.hasOwnProperty, ne = Array.isArray, k = console.createTask ? console.createTask : function() {
      return null;
    };
    T = {
      "react-stack-bottom-frame": function(e) {
        return e();
      }
    };
    var C, N = {}, Y = T["react-stack-bottom-frame"].bind(
      T,
      l
    )(), V = k(f(l)), I = {};
    v.Fragment = p, v.jsx = function(e, r, n, s, d) {
      var i = 1e4 > S.recentlyCreatedOwnerStacks++;
      return x(
        e,
        r,
        n,
        !1,
        s,
        d,
        i ? Error("react-stack-top-frame") : Y,
        i ? k(f(e)) : V
      );
    }, v.jsxs = function(e, r, n, s, d) {
      var i = 1e4 > S.recentlyCreatedOwnerStacks++;
      return x(
        e,
        r,
        n,
        !0,
        s,
        d,
        i ? Error("react-stack-top-frame") : Y,
        i ? k(f(e)) : V
      );
    };
  })()), v;
}
var D;
function Re() {
  return D || (D = 1, process.env.NODE_ENV === "production" ? _.exports = Ee() : _.exports = be()), _.exports;
}
var ve = Re();
const U = se(null), Se = ({ store: t, children: o }) => {
  const [c] = ue(() => t ?? me());
  return /* @__PURE__ */ ve.jsx(U.Provider, { value: c, children: o });
}, P = () => {
  const t = ce(U);
  if (!t)
    throw new Error("@stan/react: Store not found. Make sure to initialize StoreProvider.");
  return le(() => {
    globalThis.stanStore = t;
  }, [t]), t;
}, Te = (t, o) => [
  (c) => t.observeAtomValue(o, c),
  () => t.peekAtomValue(o)
], ke = (t) => {
  if (!W(t))
    throw new Error("Tried to read non-readable atom");
  const o = P(), [c, f] = ie(
    () => Te(o, t),
    [o, t]
  ), a = fe(c, f);
  return a instanceof Promise ? de(a) : a;
}, we = (t) => {
  if (!L(t))
    throw new Error("Tried to write non-writable atom");
  const o = P();
  return M(
    (c) => o.setAtomValue(t, c),
    [o, t]
  );
};
function Ae(t) {
  if (!L(t))
    throw new Error("Tried to write non-writable atom");
  const o = P();
  return M(
    (c) => {
      const f = W(t) ? o.peekAtomValue(t) : void 0, a = c(f);
      return o.setAtomValue(t, a);
    },
    [o, t]
  );
}
export {
  U as StanStoreContext,
  Se as StoreProvider,
  ke as useAtomValue,
  Ae as useSetAtomCallback,
  we as useSetAtomValue,
  P as useStore
};
