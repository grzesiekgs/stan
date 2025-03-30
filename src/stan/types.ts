export type AtomReadArgs = {
  get: StoreValueGetter;
  peek: StoreValueGetter;
  scheduleSet: StoreValueScheduledSetter;
};
export type ReadAtom<Value> = (args: AtomReadArgs, atomState: AtomState<Value>) => Value;

export type AtomWriteArgs = { peek: StoreValueGetter; set: StoreValueSetter };
export type WriteAtom<UpdateValue, UpdateResult = UpdateValue> = (
  args: AtomWriteArgs,
  value: UpdateValue
) => UpdateResult;
// Only writable atoms have access to callSet.
export type AtomOnObserve<Update> = [Update] extends [never] 
  ? (args: { peek: StoreValueGetter }) => void | VoidFunction
  : (args: { peek: StoreValueGetter, callSet: AtomSelfSetter<Update> }) => void | VoidFunction

export type ReadableAtomType = 'mutable' | 'derived';
export type WritableAtomType = 'mutable' | 'derived' | 'callback';
export type AtomType = ReadableAtomType | WritableAtomType;

export type ReadableAtom<Value, Update, AtomType extends ReadableAtomType = ReadableAtomType> = {
  storeLabel?: string;
  // TODO Add onMount? onObserve will be called each time when atom is started being observed.onMount would be called when atom is first mounted to store??
  onObserve?: AtomOnObserve<Update>;
  read: ReadAtom<Value>;
  type: AtomType;
};

export type WritableAtom<UpdateValue, UpdateResult, AtomType extends WritableAtomType = WritableAtomType> = {
  write: WriteAtom<UpdateValue, UpdateResult>;
  type: AtomType;
};

export type MutableAtom<Value, Update = Value> = ReadableAtom<Value, Update, 'mutable'> &
  WritableAtom<Update, Value, 'mutable'>;
export type DerivedAtom<Value, UpdateValue = never, UpdateResult = UpdateValue> = [UpdateValue] extends [never]
  ? ReadableAtom<Value, UpdateValue, 'derived'>
  : ReadableAtom<Value, UpdateValue, 'derived'> & WritableAtom<UpdateValue, UpdateResult, 'derived'>;
export type CallbackAtom<UpdateValue, UpdateResult = void> = WritableAtom<
  UpdateValue,
  UpdateResult,
  'callback'
>;

export type StoreValueGetter = <Value, Update>(atom: ReadableAtom<Value, Update>) => Value;
export type StoreValueSetter = <Update, UpdateResult>(
  atom: WritableAtom<Update, UpdateResult>,
  update: Update
) => UpdateResult;
export type StoreValueScheduledSetter = <Update, UpdateResult>(
  atom: WritableAtom<Update, UpdateResult>,
  update: Update
) => void;

export type AtomObserver<Value> = (value: Value) => void;
export type StoreValueObserver = <Value>(
  atom: ReadableAtom<Value, any>,
  observer: AtomObserver<Value>
) => VoidFunction;
export type StoreValueResetter = <Value>(atom: ReadableAtom<Value, unknown>) => void;
export type BaseAtomState = {
  isObserved: boolean;
  // Is there a scenario where this Set would incorrectly prevent garbage collection?
  // If such case will be determined, then consider wrapping each DerivedAtom in WeakRef, which can be deref'ed.
  dependencies?: Set<ReadableAtom<unknown, unknown>>;
  derivers?: Set<DerivedAtom<unknown, unknown, unknown>>;
};
export type InitialAtomState = BaseAtomState & {
  isInitialized: false;
  isFresh: false;
  value: symbol; // AtomValueNotYetCalculatedSymbolType;
};

export type DerivedAtomState<Value> = BaseAtomState & (InitialAtomState |{
  isInitialized: boolean;
  isFresh: boolean;
  value: Value;
});

export type MutableAtomState<Value> = BaseAtomState & {
  isInitialized: true;
  isFresh: true;
  value: Value;
};

export type AtomState<Value> =
  | InitialAtomState
  | DerivedAtomState<Value>
  | MutableAtomState<Value>;

export type StoreActions = {
  get: StoreValueGetter;
  peek: StoreValueGetter;
  set: StoreValueSetter;
  reset: StoreValueResetter;
};

export type AtomToStateMap = WeakMap<ReadableAtom<any, any>, AtomState<any>>;

export type Store = {
  peekAtom: StoreValueGetter;
  observeAtom: StoreValueObserver;
  setAtom: StoreValueSetter;
  resetAtom: StoreValueResetter;
};
// Maybe setSelf should return result of calling setter?
export type AtomSelfSetter<Value> = (value: Value) => void;

export type AtomValueGetterArgs = Pick<StoreActions, 'get' | 'peek'>;
export type AtomValueGetter<Value> = (getterArgs: AtomValueGetterArgs) => Value;

export type Atom<
  AT extends AtomType,
  T1 extends any,
  T2 extends any = AT extends 'derived' ? never : T1,
  T3 extends AT extends 'derived' ? any : never = AT extends 'derived' ? T2 : never
> = AT extends 'callback'
  ? CallbackAtom<T1, T2>
  : AT extends 'mutable'
  ? MutableAtom<T1, T2>
  : DerivedAtom<T1, T2, T3>;

export type AnyAtom = 
  | ReadableAtom<any, any>
  | WritableAtom<any, any>
  | (ReadableAtom<any, any> & WritableAtom<any, any>)

// createAtom related types.
export type AtomValueSetterArgs = Pick<StoreActions, 'peek' | 'set'>;
export type AtomValueSetter<UpdateValue, UpdateResult = void> = (
  setterArgs: AtomValueSetterArgs,
  updateValue: UpdateValue
) => UpdateResult;


export type CreateReadableAtomOptions<Update> ={
  storeLabel?: string;
  onObserve?: AtomOnObserve<Update>;
  // TODO Add onMount? onObserve will be called each time when atom is started being observed, onMount would be called when atom is mounted to store??
}