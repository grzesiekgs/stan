import type { AtomInitializedSymbolType } from "./symbols";

// STORE

export type StoreValueGetter = <Value>(atom: ReadableAtom<Value>) => Value;
export type StoreValueSetter = <Value>(
  atom: WritableAtom<unknown, Value>,
  value: Value
) => Value;
export type StoreValueListener<Value> = (value: Value) => void;
export type StoreValueSubscriber = <Value>(
  atom: ReadableAtom<Value>,
  listener: StoreValueListener<Value>
) => VoidFunction;

export type AtomState<Value> = {
  value: Value;
  deps?: Set<ReadableAtom<unknown>>;
};

export type StoreActions = {
  get: StoreValueGetter;
  peek: StoreValueGetter;
  set: StoreValueSetter;
};

export type AtomToStateMap = WeakMap<ReadableAtom<any>, AtomState<any>>;

export type Store = {
  peekAtomValue: StoreValueGetter;
  subscribeToAtomValue: StoreValueSubscriber;
  setAtomValue: StoreValueSetter;
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

export type AtomValueSubscriberArgs<Value> = {
  setSelf: AtomSelfSetter<Value>;
  peek: StoreValueGetter;
};
export type AtomValueSubscriber<Value> = (
  subscriberArgs: AtomValueSubscriberArgs<Value>
) => void | VoidFunction;

export type WritableAtom<Update, UpdateResult> = {
  write: AtomValueSetter<Update, UpdateResult>;
};

export type ReadableAtom<Value> = {
  onSubscribe?: AtomValueSubscriber<Value>;
} & (
  | {
      read?: never;
      initialValue: Value;
    }
  | {
      read: AtomValueGetter<Value>;
      initialValue?: never;
    }
);

export type MutableAtom<Value, UpdateValue = Value> = WritableAtom<
  UpdateValue,
  Value
> & {
  initialValue: Value;
  onSubscribe?: AtomValueSubscriber<Value>;
};

export type DerivedAtom<Value> = {
  read: AtomValueGetter<Value>;
  onSubscribe?: AtomValueSubscriber<Value>;
};

export type CallbackAtom<Update, UpdateResult = void> = WritableAtom<
  Update,
  UpdateResult
>;

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
  onSubscribe: () => {},
};

const testCallback: Atom<never, string, number> = {
  write: (a, u) => Number(u),
};
