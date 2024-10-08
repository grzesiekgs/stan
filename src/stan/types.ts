// STORE

export type StoreValueGetter = <Value>(atom: StatefulAtom<Value, any>) => Value;
export type StoreValueSetter = <Update, UpdateResult>(
  atom: WritableAtom<Update, UpdateResult>,
  update: Update
) => UpdateResult;

export type ReadAtomArgs = { get: StoreValueGetter; peek: StoreValueGetter };
export type ReadAtom<Value> = (args: ReadAtomArgs, atomState: AtomState<Value>) => Value;

export type WriteAtomArgs = { peek: StoreValueGetter; set: StoreValueSetter };
export type WriteAtom<UpdateValue, UpdateResult> = (
  args: WriteAtomArgs,
  value: UpdateValue
) => UpdateResult;

export type AtomValueObserver<Value> = (value: Value) => void;
export type StoreValueObserver = <Value, UpdateValue>(
  atom: StatefulAtom<Value, UpdateValue>,
  observer: AtomValueObserver<Value>
) => VoidFunction;
export type StoreValueResetter = <Value>(atom: StatefulAtom<Value>) => void;
export type BaseAtomState = {
  // Is there a scenario where this Set would incorrectly prevent garbage collection?
  // If such case will be determined, then consider wrapping each DerivedAtom in WeakRef, which can be deref'ed.
  isObserved: boolean;
  dependencies?: Set<StatefulAtom<unknown>>;
  derivers?: Set<DerivedAtom<unknown>>;
};
export type InitialDerivedAtomState = BaseAtomState & {
  isInitialized: false;
  isFresh: false;
  value: symbol; // AtomValueNotYetCalculatedSymbolType;
};

export type DerivedAtomState<Value> = BaseAtomState & {
  isInitialized: true;
  isFresh: boolean;
  value: Value;
};

export type MutableAtomState<Value> = BaseAtomState & {
  isInitialized: true;
  isFresh: true;
  value: Value;
};

export type AtomState<Value> =
  | InitialDerivedAtomState
  | DerivedAtomState<Value>
  | MutableAtomState<Value>;

export type StoreActions = {
  get: StoreValueGetter;
  peek: StoreValueGetter;
  set: StoreValueSetter;
  reset: StoreValueResetter;
};

export type AtomToStateMap = WeakMap<StatefulAtom<any>, AtomState<any>>;

export type Store = {
  peekAtom: StoreValueGetter;
  observeAtom: StoreValueObserver;
  setAtom: StoreValueSetter;
  resetAtom: StoreValueResetter;
};

// ATOM
export type AtomSelfSetter<Value> = (value: Value) => void;

export type AtomValueGetterArgs = Pick<StoreActions, 'get' | 'peek'>;
export type AtomValueGetter<Value> = (getterArgs: AtomValueGetterArgs) => Value;

export type AtomValueSetterArgs = Pick<StoreActions, 'peek' | 'set'>;
export type AtomValueSetter<UpdateValue, UpdateResult = void> = (
  setterArgs: AtomValueSetterArgs,
  updateValue: UpdateValue
) => UpdateResult;
export type AtomOnObserve<Value> = (args: {
  setSelf: AtomSelfSetter<Value>;
  peek: StoreValueGetter;
}) => void | VoidFunction;

export type WritableAtom<UpdateValue, UpdateResult> = {
  write: WriteAtom<UpdateValue, UpdateResult>;
};

export type DerivedAtom<Value> = {
  label: string;
  onObserve?: AtomOnObserve<Value>;
  read: ReadAtom<Value>;
};

export type MutableAtom<Value, UpdateValue = Value> = WritableAtom<UpdateValue, Value> &
  DerivedAtom<Value> & {
    initialValue: Value;
  };

export type CallbackAtom<Update, UpdateValue = void> = WritableAtom<Update, UpdateValue>;
export type StatefulAtom<Value, UpdateValue = any> =
  | DerivedAtom<Value>
  | MutableAtom<Value, UpdateValue>;

export type Atom<
  Value,
  UpdateValue = Value,
  UpdateResult extends [Value] extends [never] ? any : Value = [Value] extends [never] ? any : Value
> = [Value] extends [never]
  ? CallbackAtom<UpdateValue, UpdateResult>
  : [UpdateValue] extends [never]
  ? DerivedAtom<Value>
  : MutableAtom<Value, UpdateValue>;

export type AnyAtom = DerivedAtom<any> | MutableAtom<any, any> | CallbackAtom<any, any>;

const testMutable: Atom<number> = {
  label: 'mutable',
  initialValue: 0,
  write: (a, v) => v,
  read: () => 0,
};

const testMutable1: Atom<number, string> = {
  label: 'mutable1',
  initialValue: 0,
  write: (a, v) => Number(v),
  read: () => 0,
};

const testMutable2: Atom<number, string, number> = {
  label: 'mutable2',
  initialValue: 0,
  write: (a, v) => Number(v),
  read: () => 0,
};

const testDerived: Atom<number, never> = {
  label: 'derived',
  read: () => 0,
  onObserve: () => {},
};

const testCallback: Atom<never, string, number> = {
  write: (a, v) => Number(v),
};
