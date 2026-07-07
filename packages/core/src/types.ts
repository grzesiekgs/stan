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
export type AtomCallback<DerivedValue, UpdateValue, UpdateResult = UpdateValue> = [
  DerivedValue,
] extends [never]
  ? (args: AtomCallbackArgs, value: UpdateValue) => UpdateResult
  : (args: AtomCallbackArgs, value: UpdateValue, derivedValue: DerivedValue) => UpdateResult;
export type AtomOnUnobserve<Value> = (value: Value) => void;
export type AtomOnObserveResultObject<Value, Update> = [Update] extends [never]
  ? { onUnobserve?: AtomOnUnobserve<Value> }
  : { onUnobserve?: AtomOnUnobserve<Value>; value: Update };
export type AtomOnObserveResult<Value, Update> =
  | void
  | AtomOnUnobserve<Value>
  | AtomOnObserveResultObject<Value, Update>;
// onObserve is available for GettableAtoms, but only mutable atom has access to setSelf.
export type AtomOnObserve<Value, Update> = [Update] extends [never]
  ? (args: { peek: StoreGetAtom }, currentValue: Value) => void | AtomOnObserveResult<Value, Update>
  : (
      args: {
        // Allows to peek other value
        peek: StoreGetAtom;
        // Allow to self-update, has same reprecursions as calling Store.set(atom, update)
        setSelf: AtomSetSelf<Update>;
      },
      currentValue: Value
    ) => AtomOnObserveResult<Value, Update>;
      

export type GettableAtomType = 'mutable' | 'derived' | 'observer';
export type SettableAtomType = 'mutable' | 'derived' | 'callback';
export type AtomType = GettableAtomType | SettableAtomType;

export type SettableAtomDerivedValue<
  AtomType extends SettableAtomType,
  UpdateResult,
> = AtomType extends 'mutable' ? UpdateResult : AtomType extends 'callback' ? never : unknown;

export type SettableAtom<
  AtomType extends SettableAtomType,
  UpdateValue,
  UpdateResult,
  DerivedValue extends SettableAtomDerivedValue<AtomType, UpdateResult> = SettableAtomDerivedValue<
    AtomType,
    UpdateResult
  >,
> = {
  type: AtomType;
} & (AtomType extends 'mutable'
  ? {
      write: AtomWrite<UpdateResult, UpdateValue>;
    }
  : {
      callback: AtomCallback<DerivedValue, UpdateValue, UpdateResult>;
    });

export type StoreAtom<Value, Update> = {
  storeLabel?: string;
  read: AtomRead<Value>;
  onObserve?: AtomOnObserve<Value, Update>;
};

export type MutableAtom<Value, Update = Value> = StoreAtom<Value, Update> & {
  type: 'mutable';
  write: AtomWrite<Value, Update>;
  initialValue: Value;
};

export type DerivedAtom<Value, UpdateValue = void, UpdateResult = UpdateValue> = StoreAtom<
  Value,
  never
> & {
  type: 'derived';
  callback?: AtomCallback<Value, UpdateValue, UpdateResult>;
};

export type SettableDerivedAtom<Value, UpdateValue, UpdateResult = UpdateValue> = DerivedAtom<
  Value,
  UpdateValue,
  UpdateResult
> & {
  callback: AtomCallback<Value, UpdateValue, UpdateResult>;
};

export type ObserverAtom = StoreAtom<void, never> & {
  type: 'observer';
};

export type GettableAtom<Value = any> =
  | MutableAtom<Value, any>
  | DerivedAtom<Value, any, any>
  | ObserverAtom;

export type CallbackAtom<UpdateValue, UpdateResult = void> = SettableAtom<
  'callback',
  UpdateValue,
  UpdateResult
>;

export type AnyAtom = GettableAtom | CallbackAtom<any, any>;

export type AnySettableAtom<Update, UpdateResult, TrackedValue> =
  | MutableAtom<UpdateResult, Update>
  | CallbackAtom<Update, UpdateResult>
  | SettableDerivedAtom<TrackedValue, Update, UpdateResult>;

export type DependentAtom<Value = any> = ObserverAtom | DerivedAtom<Value, any, any>;

export type DependencyAtom<Value> = GettableAtom<Value>;

export type StoreGetAtom = <Value>(atom: GettableAtom<Value>) => Value;
export type StorePeekAtom = <Value>(atom: GettableAtom<Value>) => Value;
export type StoreSetAtom = <Update, UpdateResult, TrackedValue>(
  atom: AnySettableAtom<Update, UpdateResult, TrackedValue>,
  update: Update
) => UpdateResult;
export type StoreResetAtomState = <Value>(atom: GettableAtom<Value>) => void;
export type StoreGetAtomState = <Value>(atom: GettableAtom<Value>) => AtomState<Value>;
export type StoreObserveAtom = <Value>(
  atom: GettableAtom<Value>,
  observer: ObserveAtomValue<Value>
) => VoidFunction;

export type AtomReadCycle = {
  id: number; // TODO Most likely simplify by removing id
  chain: Set<GettableAtom>;
  observed: boolean;
};

export type ReadAtomValue = (atom: GettableAtom, readCycle: AtomReadCycle) => any;
export type WriteAtomValue = <Update, UpdateResult, TrackedValue>(
  atom: AnySettableAtom<Update, UpdateResult, TrackedValue>,
  update: Update
) => UpdateResult;

export type ScheduleWriteAtomValue = <Update, UpdateResult, TrackedValue>(
  atom: AnySettableAtom<Update, UpdateResult, TrackedValue>,
  update: Update
) => void;
export type ObserveAtomValue<Value> = (value: Value) => void;
export type GetAtomValue<Value> = (atom: GettableAtom<Value>) => Value;

// Require properties with undefined as allowed value, instead of making them optional.
// This could help optimize atomState object by JS engine, but it's just theory, as atomState.value can be of any type.
export type BaseAtomState<Value = unknown> = {
  isObserved: boolean;
  // D
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

export type MutableAtomState<Value> = BaseAtomState & {
  status: AtomStateStatus.FRESH;
  value: Value;
};

export type AtomState<Value> = DerivedAtomState<Value> | MutableAtomState<Value>;

export type AtomStoreApi = {
  get: StoreGetAtom;
  peek: StoreGetAtom;
  set: StoreSetAtom;
  reset: StoreResetAtomState;
};

export type AtomToStateMap = WeakMap<GettableAtom, AtomState<any>>;

export type Store = {
  peekAtom: StorePeekAtom;
  observeAtom: StoreObserveAtom;
  setAtom: StoreSetAtom;
  resetAtomState: StoreResetAtomState;
  getAtomState: StoreGetAtomState;
  peekAtomToStateMap: () => AtomToStateMap;
};
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