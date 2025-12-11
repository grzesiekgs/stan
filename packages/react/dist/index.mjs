import ne, { createContext as oe, useContext as ae, useMemo as se, useSyncExternalStore as ue, useCallback as M } from "react";
import { isWritableAtom as W, isReadableAtom as ce } from "@stan/core";
var T = { exports: {} }, R = {};
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
function le() {
  if ($) return R;
  $ = 1;
  var t = Symbol.for("react.transitional.element"), o = Symbol.for("react.fragment");
  function c(f, u, l) {
    var E = null;
    if (l !== void 0 && (E = "" + l), u.key !== void 0 && (E = "" + u.key), "key" in u) {
      l = {};
      for (var b in u)
        b !== "key" && (l[b] = u[b]);
    } else l = u;
    return u = l.ref, {
      $$typeof: t,
      type: f,
      key: E,
      ref: u !== void 0 ? u : null,
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
function ie() {
  return F || (F = 1, process.env.NODE_ENV !== "production" && function() {
    function t(e) {
      if (e == null) return null;
      if (typeof e == "function")
        return e.$$typeof === ee ? null : e.displayName || e.name || null;
      if (typeof e == "string") return e;
      switch (e) {
        case p:
          return "Fragment";
        case J:
          return "Profiler";
        case z:
          return "StrictMode";
        case H:
          return "Suspense";
        case Z:
          return "SuspenseList";
        case K:
          return "Activity";
      }
      if (typeof e == "object")
        switch (typeof e.tag == "number" && console.error(
          "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
        ), e.$$typeof) {
          case q:
            return "Portal";
          case X:
            return (e.displayName || "Context") + ".Provider";
          case G:
            return (e._context.displayName || "Context") + ".Consumer";
          case B:
            var r = e.render;
            return e = e.displayName, e || (e = r.displayName || r.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
          case Q:
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
        var n = r.error, a = typeof Symbol == "function" && Symbol.toStringTag && e[Symbol.toStringTag] || e.constructor.name || "Object";
        return n.call(
          r,
          "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
          a
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
    function u() {
      var e = k.A;
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
    function L() {
      var e = t(this.type);
      return N[e] || (N[e] = !0, console.error(
        "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
      )), e = this.props.ref, e !== void 0 ? e : null;
    }
    function U(e, r, n, a, d, i, A, O) {
      return n = i.ref, e = {
        $$typeof: g,
        type: e,
        key: r,
        props: i,
        _owner: d
      }, (n !== void 0 ? n : null) !== null ? Object.defineProperty(e, "ref", {
        enumerable: !1,
        get: L
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
        value: A
      }), Object.defineProperty(e, "_debugTask", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: O
      }), Object.freeze && (Object.freeze(e.props), Object.freeze(e)), e;
    }
    function x(e, r, n, a, d, i, A, O) {
      var s = r.children;
      if (s !== void 0)
        if (a)
          if (re(s)) {
            for (a = 0; a < s.length; a++)
              h(s[a]);
            Object.freeze && Object.freeze(s);
          } else
            console.error(
              "React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead."
            );
        else h(s);
      if (y.call(r, "key")) {
        s = t(e);
        var m = Object.keys(r).filter(function(te) {
          return te !== "key";
        });
        a = 0 < m.length ? "{key: someKey, " + m.join(": ..., ") + ": ...}" : "{key: someKey}", I[s + a] || (m = 0 < m.length ? "{" + m.join(": ..., ") + ": ...}" : "{}", console.error(
          `A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`,
          a,
          s,
          m,
          s
        ), I[s + a] = !0);
      }
      if (s = null, n !== void 0 && (c(n), s = "" + n), E(r) && (c(r.key), s = "" + r.key), "key" in r) {
        n = {};
        for (var w in r)
          w !== "key" && (n[w] = r[w]);
      } else n = r;
      return s && b(
        n,
        typeof e == "function" ? e.displayName || e.name || "Unknown" : e
      ), U(
        e,
        s,
        i,
        d,
        u(),
        n,
        A,
        O
      );
    }
    function h(e) {
      typeof e == "object" && e !== null && e.$$typeof === g && e._store && (e._store.validated = 1);
    }
    var _ = ne, g = Symbol.for("react.transitional.element"), q = Symbol.for("react.portal"), p = Symbol.for("react.fragment"), z = Symbol.for("react.strict_mode"), J = Symbol.for("react.profiler"), G = Symbol.for("react.consumer"), X = Symbol.for("react.context"), B = Symbol.for("react.forward_ref"), H = Symbol.for("react.suspense"), Z = Symbol.for("react.suspense_list"), Q = Symbol.for("react.memo"), j = Symbol.for("react.lazy"), K = Symbol.for("react.activity"), ee = Symbol.for("react.client.reference"), k = _.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, y = Object.prototype.hasOwnProperty, re = Array.isArray, S = console.createTask ? console.createTask : function() {
      return null;
    };
    _ = {
      "react-stack-bottom-frame": function(e) {
        return e();
      }
    };
    var C, N = {}, Y = _["react-stack-bottom-frame"].bind(
      _,
      l
    )(), V = S(f(l)), I = {};
    v.Fragment = p, v.jsx = function(e, r, n, a, d) {
      var i = 1e4 > k.recentlyCreatedOwnerStacks++;
      return x(
        e,
        r,
        n,
        !1,
        a,
        d,
        i ? Error("react-stack-top-frame") : Y,
        i ? S(f(e)) : V
      );
    }, v.jsxs = function(e, r, n, a, d) {
      var i = 1e4 > k.recentlyCreatedOwnerStacks++;
      return x(
        e,
        r,
        n,
        !0,
        a,
        d,
        i ? Error("react-stack-top-frame") : Y,
        i ? S(f(e)) : V
      );
    };
  }()), v;
}
var D;
function fe() {
  return D || (D = 1, process.env.NODE_ENV === "production" ? T.exports = le() : T.exports = ie()), T.exports;
}
fe();
const de = oe(null), P = () => {
  const t = ae(de);
  if (!t)
    throw new Error("@stan/react: Store not found. Make sure to initialize StoreProvider.");
  return t;
}, me = (t, o) => [
  (c) => t.observeAtomValue(o, c),
  () => t.peekAtomValue(o)
], Re = (t) => {
  const o = P(), [c, f] = se(
    () => me(o, t),
    [o, t]
  );
  return ue(c, f);
}, ve = (t) => {
  if (!W(t))
    throw new Error("Tried to write non-writable atom");
  const o = P();
  return M(
    (c) => o.setAtomValue(t, c),
    [o, t]
  );
};
function _e(t) {
  if (!W(t))
    throw new Error("Tried to write non-writable atom");
  const o = P();
  return M(
    (c) => {
      const f = ce(t) ? o.peekAtomValue(t) : void 0, u = c(f);
      return o.setAtomValue(t, u);
    },
    [o, t]
  );
}
export {
  Re as useAtomValue,
  _e as useSetAtomCallback,
  ve as useSetAtomValue
};
