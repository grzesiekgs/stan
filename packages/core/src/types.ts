import { EmptyAtomValueSymbolType } from './symbols';

export type AtomReadArgs = {
  get: StoreGetAtom;
  peek: StoreGetAtom;
  scheduleSet: ScheduleWriteAtomValue;
};
export type AtomRead<Value> = (
  args: AtomReadArgs,
  lastValue: Value | EmptyAtomValueSymbolType
) => Value;

export type AtomWriteArgs = { peek: StoreGetAtom };
export type AtomWrite<Value, Update = Value> = (
  args: AtomWriteArgs,
  update: Update,
  value: Value
) => Value;

export type AtomCallbackArgs = { peek: StoreGetAtom; set: StoreSetAtom };
export type AtomCallback<UpdateValue, UpdateResult = UpdateValue, DerivedValue = never> = [
  DerivedValue,
] extends [never]
  ? (args: AtomCallbackArgs, value: UpdateValue) => UpdateResult
  : (args: AtomCallbackArgs, value: UpdateValue, derivedValue: DerivedValue) => UpdateResult;

export type AtomOnUnobserveOptions = { reset?: boolean };
export type AtomOnUnobserve<Value> = (currentValue: Value) => void | AtomOnUnobserveOptions;
export type AtomOnUnobserveResult<Value> = void | AtomOnUnobserveOptions | AtomOnUnobserve<Value>;
export type AtomOnObserve<Value, Update> = (
  args: [Update] extends [never]
    ? { peek: StoreGetAtom }
    : { peek: StoreGetAtom; setSelf: (update: Update) => Value },
  currentValue: Value
) => void | AtomOnUnobserve<Value>;
export type AtomOnReset<Value> = (currentValue: Value) => void;

export type GettableAtomType = 'mutable' | 'derived' | 'observer';
export type SettableAtomType = 'mutable' | 'derived' | 'callback';
export type EveryAtomType = GettableAtomType | SettableAtomType;

export type SettableAtomDerivedValue<
  AtomType extends SettableAtomType,
  UpdateResult,
> = AtomType extends 'mutable'
  ? UpdateResult
  : AtomType extends 'callback'
    ? never
    : unknown | EmptyAtomValueSymbolType;

export type SettableAtom<
  Update,
  Result = Update,
  AtomType extends SettableAtomType = SettableAtomType,
  DerivedValue extends SettableAtomDerivedValue<AtomType, Result> = SettableAtomDerivedValue<
    AtomType,
    Result
  >,
> = {
  type: AtomType;
} & (AtomType extends 'mutable'
  ? {
      write: AtomWrite<Result, Update>;
    }
  : {
      callback: AtomCallback<Update, Result, DerivedValue>;
    });

export type GettableAtom<
  Value = any,
  Update = Value,
  AtomType extends GettableAtomType = GettableAtomType,
> = {
  type: AtomType;
  storeLabel?: string;
  read: AtomRead<Value>;
  onObserve?: AtomOnObserve<Value, Update>;
  onReset?: AtomOnReset<Value>;
};

export type MutableAtomGetInitialValue<Value> = () => Value;
export type MutableAtom<Value, Update = Value> = GettableAtom<Value, Update, 'mutable'> &
  SettableAtom<Update, Value, 'mutable'> & {
    getInitialValue: MutableAtomGetInitialValue<Value>;
  };

export type DerivedAtom<Value, UpdateValue = never, UpdateResult = UpdateValue> = GettableAtom<
  Value,
  // Derived atom cannot override it's value when onObserve is called.
  never,
  'derived'
> &
  ([UpdateValue] extends [never]
    ? {}
    : SettableAtom<UpdateValue, UpdateResult, 'derived', Value | EmptyAtomValueSymbolType>);

export type ObserverAtom = GettableAtom<void, never, 'observer'>;

export type CallbackAtom<UpdateValue, UpdateResult = void> = SettableAtom<
  UpdateValue,
  UpdateResult,
  'callback'
>;

export type AnyAtom =
  | GettableAtom<any, any, GettableAtomType>
  | SettableAtom<any, any, SettableAtomType, any>;

export type DependentAtom<Value = unknown> = ObserverAtom | DerivedAtom<Value, unknown, unknown>;

export type DependencyAtom<Value> = GettableAtom<Value>;

export type StoreGetAtom = <Value>(atom: GettableAtom<Value>) => Value;
export type StorePeekAtom = <Value>(atom: GettableAtom<Value>) => Value;
export type StoreSetAtom = <
  Update,
  UpdateResult,
  AtomType extends SettableAtomType,
  TrackedValue extends SettableAtomDerivedValue<AtomType, UpdateResult> = SettableAtomDerivedValue<
    AtomType,
    UpdateResult
  >,
>(
  atom: SettableAtom<Update, UpdateResult, AtomType, TrackedValue>,
  update: Update
) => UpdateResult;


export type StoreResetAtomState = <Value>(atom: GettableAtom<Value>) => void;
export type StoreGetAtomState = <Value>(atom: GettableAtom<Value>) => AtomState<Value>;
export type ObserveAtomValue<Value> = (value: Value) => void;
export type StoreObserveAtom = <Value>(
  atom: GettableAtom<Value>,
  observer: ObserveAtomValue<Value>
) => VoidFunction;

export type AtomReadCycle = {
  id: number; // TODO Most likely simplify by removing id
  chain: Set<GettableAtom<any>>;
  observed: boolean;
};

// Same as StoreGetAtom
export type ReadAtomValue = <Value>(atom: GettableAtom<Value>, readCycle: AtomReadCycle) => Value;
// Same as StoreSetAtom
export type WriteAtomValue = <
  Update,
  UpdateResult,
  AtomType extends SettableAtomType,
  TrackedValue extends SettableAtomDerivedValue<AtomType, UpdateResult> = SettableAtomDerivedValue<
    AtomType,
    UpdateResult
  >,
>(
  atom: SettableAtom<Update, UpdateResult, AtomType, TrackedValue>,
  update: Update
) => UpdateResult;
// Same as WriteAtomValue but returns void as we are scheduling update, not doing it immediately.
export type ScheduleWriteAtomValue = <
  Update,
  UpdateResult,
  AtomType extends SettableAtomType,
  TrackedValue extends SettableAtomDerivedValue<AtomType, UpdateResult> = SettableAtomDerivedValue<
    AtomType,
    UpdateResult
  >,
>(
  atom: SettableAtom<Update, UpdateResult, AtomType, TrackedValue>,
  update: Update
) => void;

export type BaseAtomState<Value> = {
  isObserved: boolean;
  onUnobserve: AtomOnUnobserve<Value> | undefined;
  // TODO Is there a scenario where this Set would incorrectly prevent garbage collection?
  // If such case will be determined, then consider wrapping each DerivedAtom in WeakRef, which can be deref'ed.
  dependencies: Set<DependencyAtom<unknown>> | undefined;
  dependents: Set<DependentAtom<unknown>> | undefined;
  status: AtomStateStatus;
};

export enum AtomStateStatus {
  FRESH = 'fresh',
  STALE = 'stale',
  UNDETERMINED = 'undetermined',
}
export type InitialDerivedAtomState<Value> = BaseAtomState<Value | EmptyAtomValueSymbolType> & {
  status: AtomStateStatus.STALE;
  value: EmptyAtomValueSymbolType; // AtomValueNotYetCalculatedSymbolType;
};

export type DerivedAtomState<Value> = BaseAtomState<Value> &
  (
    | InitialDerivedAtomState<Value>
    | {
        status: AtomStateStatus;
        value: Value;
      }
  );

export type MutableAtomState<Value> = BaseAtomState<Value> & {
  status: AtomStateStatus.FRESH;
  value: Value;
};
// Note that there's no ObserverAtomState. ObserverAtom will always return void,
// therefore it will never propagate updates to it's derivers.
export type AtomState<Value> = DerivedAtomState<Value> | MutableAtomState<Value>;

export type AtomStoreApi = {
  get: StoreGetAtom;
  peek: StoreGetAtom;
  set: StoreSetAtom;
  reset: StoreResetAtomState;
};

export type AtomToStateMap = WeakMap<GettableAtom<any>, AtomState<any>>;

export type Store = {
  peekAtom: StorePeekAtom;
  observeAtom: StoreObserveAtom;
  setAtom: StoreSetAtom;
  resetAtomState: StoreResetAtomState;
  getAtomState: StoreGetAtomState;
  peekAtomToStateMap: () => AtomToStateMap;
};
export type OnObserveStoreApi = Pick<Store, 'peekAtom' | 'setAtom'>;
// Consider setSelf returning result of calling atom.write.
export type AtomSetSelf<Value> = (value: Value) => void;

export type AtomValueGetterArgs = Pick<AtomStoreApi, 'get' | 'peek'>;
export type AtomValueGetter<Value> = (getterArgs: AtomValueGetterArgs) => Value;

// createAtom related types.
export type AtomValueSetterArgs = Pick<AtomStoreApi, 'peek' | 'set'>;
export type AtomValueSetter<UpdateValue, UpdateResult = void> = (
  setterArgs: AtomValueSetterArgs,
  updateValue: UpdateValue
) => UpdateResult;

export type CreateGettableAtomOptions<Value, Update> = {
  storeLabel?: string;
  // TODO Add onMount? Look ReadableAtom/WritableAtom for more details.
  onObserve?: [Update] extends [never] ? AtomOnObserve<Value, never> : AtomOnObserve<Value, Update>;
};

export type UnwrapPromise<Type> = Type extends Promise<infer PromiseType> ? PromiseType : Type; 