import type { AtomValueNotYetCalculatedSymbolType } from "./symbols";

// STORE

export type StoreValueGetter = <Value>(atom: ReadableAtom<Value>) => Value;
export type StoreValueSetter = <Update, UpdateResult>(
  atom: WritableAtom<Update, UpdateResult>,
  value: Update
) => UpdateResult;
export type AtomValueObserver<Value> = (value: Value) => void;
export type StoreValueObserver = <Value>(
  atom: ReadableAtom<Value>,
  observer: AtomValueObserver<Value>
) => VoidFunction;
export type StoreValueResetter = <Value>(
  atom: ReadableAtom<Value>
) => void;
export type BaseAtomState = {
  isObserved: boolean;
  isFresh: boolean;
  // Is there a scenario where this Set would incorrectly prevent garbage collection?
  // If such case will be determined, then consider wrapping each DerivedAtom in WeakRef, which can be deref'ed.
  depencencies?: Set<ReadableAtom<unknown>>;
  derivers?: Set<DerivedAtom<unknown>>;
}
export type InitialDerivedAtomState = BaseAtomState & {
  value: AtomValueNotYetCalculatedSymbolType;
  isFresh: false;
}

export type DerivedAtomState<Value> = BaseAtomState & {
  value: Value;
}

export type MutableAtomState<Value> = BaseAtomState & {
  value: Value;
  isFresh: true;
}

export type AtomState<Value> = InitialDerivedAtomState | DerivedAtomState<Value> | MutableAtomState<Value>;

export type StoreActions = {
  get: StoreValueGetter;
  peek: StoreValueGetter;
  set: StoreValueSetter;
  reset: 
};

export type AtomToStateMap = WeakMap<ReadableAtom<any>, AtomState<any>>;

export type Store = {
  peekAtomValue: StoreValueGetter;
  observeAtomValue: StoreValueObserver;
  setAtomValue: StoreValueSetter;
  resetAtomValue: StoreValueResetter;
};

// ATOM
export type AtomSelfSetter<Value> = (value: Value) => void;

export type AtomValueGetterArgs = Pick<StoreActions, "get" | "peek">;
export type AtomValueGetter<Value> = (getterArgs: AtomValueGetterArgs) => Value;

export type AtomValueSetterArgs = Pick<StoreActions, "peek" | "set">;
export type AtomValueSetter<UpdateValue, UpdateResult = void> = (
  setterArgs: AtomValueSetterArgs,
  updateValue: UpdateValue
) => UpdateResult;
export type AtomOnObserve<Value> = (args: {
  setSelf: AtomSelfSetter<Value>;
  peek: StoreValueGetter;
}) => void | VoidFunction;

export type WritableAtom<Update, UpdateResult> = {
  write: AtomValueSetter<Update, UpdateResult>;
};

export type DerivedAtom<Value> = {
  onObserve?: AtomOnObserve<Value>;
  read: AtomValueGetter<Value>;
}

export type MutableAtom<Value, UpdateValue = Value> = WritableAtom<
  UpdateValue,
  Value
> & {
  initialValue: Value;
  onObserve?: AtomOnObserve<Value>;
};

export type CallbackAtom<Update, UpdateResult = void> = WritableAtom<
  Update,
  UpdateResult
>;
export type ReadableAtom<Value> = MutableAtom<Value, any> | DerivedAtom<Value>;


export type Atom<
  Value,
  UpdateValue = Value,
  UpdateResult extends [Value] extends [never] ? any : Value = [Value] extends [
    never
  ]
    ? any
    : Value
> = [Value] extends [never]
  ? CallbackAtom<UpdateValue, UpdateResult>
  : [UpdateValue] extends [never]
  ? DerivedAtom<Value>
  : MutableAtom<Value, UpdateValue>;

const testMutable: Atom<number, string> = {
  initialValue: 0,
  write: (a, u) => Number(u),
};

const testMutable2: Atom<number, string, number> = {
  initialValue: 0,
  write: (a, u) => Number(u),
};

const testDerived: Atom<number, never> = {
  read: () => 0,
  onObserve: () => { },
};

const testCallback: Atom<never, string, number> = {
  write: (a, u) => Number(u),
};
