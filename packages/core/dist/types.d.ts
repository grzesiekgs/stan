export type AtomReadArgs = {
    get: StoreGet;
    peek: StoreGet;
    scheduleSet: ScheduleWriteAtomValue;
};
export type ReadAtom<Value> = (args: AtomReadArgs, atomState: AtomState<Value>) => Value;
export type AtomWriteArgs = {
    peek: StoreGet;
    set: StoreSet;
};
export type WriteAtom<UpdateValue, UpdateResult = UpdateValue> = (args: AtomWriteArgs, value: UpdateValue) => UpdateResult;
export type AtomOnObserve<Update> = [Update] extends [never] ? (args: {
    peek: StoreGet;
}) => void | VoidFunction : (args: {
    peek: StoreGet;
    setSelf: AtomSetSelf<Update>;
}) => void | VoidFunction;
export type ReadableAtomType = 'mutable' | 'derived';
export type WritableAtomType = 'mutable' | 'derived' | 'callback';
export type AtomType = ReadableAtomType | WritableAtomType;
export type ReadableAtom<Value, AtomType extends ReadableAtomType = ReadableAtomType> = {
    storeLabel?: string;
    onObserve?: AtomOnObserve<never>;
    read: ReadAtom<Value>;
    type: AtomType;
};
export type WritableAtom<UpdateValue, UpdateResult, AtomType extends WritableAtomType = WritableAtomType> = {
    write: WriteAtom<UpdateValue, UpdateResult>;
    type: AtomType;
    onObserve?: AtomOnObserve<UpdateValue>;
};
export type MutableAtom<Value, Update = Value> = ReadableAtom<Value, 'mutable'> & WritableAtom<Update, Value, 'mutable'> & {
    initialValue: Value;
};
export type DerivedAtom<Value, UpdateValue = never, UpdateResult = UpdateValue> = [UpdateValue] extends [never] ? ReadableAtom<Value, 'derived'> : ReadableAtom<Value, 'derived'> & WritableAtom<UpdateValue, UpdateResult, 'derived'>;
export type CallbackAtom<UpdateValue, UpdateResult = void> = WritableAtom<UpdateValue, UpdateResult, 'callback'>;
export type StoreGet = <Value>(atom: ReadableAtom<Value>) => Value;
export type StorePeek = <Value>(atom: ReadableAtom<Value>) => Value;
export type StoreSet = <Update, UpdateResult>(atom: WritableAtom<Update, UpdateResult>, update: Update) => UpdateResult;
export type StoreReset = <Value>(atom: ReadableAtom<Value>) => void;
export type StoreObserve = <Value>(atom: ReadableAtom<Value, any>, observer: ObserveAtomValue<Value>) => VoidFunction;
export type ReadAtomValue = <Value>(atom: ReadableAtom<Value>, observe?: boolean) => Value;
export type WriteAtomValue = <Update, UpdateResult>(atom: WritableAtom<Update, UpdateResult>, update: Update) => UpdateResult;
export type ScheduleWriteAtomValue = <Update, UpdateResult>(atom: WritableAtom<Update, UpdateResult>, update: Update) => void;
export type ObserveAtomValue<Value> = (value: Value) => void;
export type GetAtomValue<Value> = (atom: ReadableAtom<Value>) => Value;
export type BaseAtomState = {
    isObserved: boolean;
    onUnobserve: VoidFunction | undefined;
    dependencies: Set<ReadableAtom<unknown>> | undefined;
    derivers: Set<DerivedAtom<unknown, unknown, unknown>> | undefined;
};
export declare enum AtomStateStatus {
    FRESH = "fresh",
    STALE = "stale",
    PENDING = "pending"
}
export type InitialAtomState = BaseAtomState & {
    status: AtomStateStatus.STALE;
    value: symbol;
};
export type DerivedAtomState<Value> = BaseAtomState & (InitialAtomState | {
    status: AtomStateStatus;
    value: Value;
});
export type MutableAtomState<Value> = BaseAtomState & {
    status: AtomStateStatus.FRESH;
    value: Value;
};
export type AtomState<Value> = InitialAtomState | DerivedAtomState<Value> | MutableAtomState<Value>;
export type StoreActions = {
    get: StoreGet;
    peek: StoreGet;
    set: StoreSet;
    reset: StoreReset;
};
export type AtomToStateMap = WeakMap<ReadableAtom<any, any>, AtomState<any>>;
export type Store = {
    peekAtom: StorePeek;
    observeAtom: StoreObserve;
    setAtom: StoreSet;
    resetAtom: StoreReset;
};
export type AtomSetSelf<Value> = (value: Value) => void;
export type AtomValueGetterArgs = Pick<StoreActions, 'get' | 'peek'>;
export type AtomValueGetter<Value> = (getterArgs: AtomValueGetterArgs) => Value;
export type Atom<AT extends AtomType, T1, T2 = AT extends 'derived' ? never : T1, T3 extends AT extends 'derived' ? any : never = AT extends 'derived' ? T2 : never> = AT extends 'callback' ? CallbackAtom<T1, T2> : AT extends 'mutable' ? MutableAtom<T1, T2> : DerivedAtom<T1, T2, T3>;
export type AnyAtom = ReadableAtom<any, any> | WritableAtom<any, any> | (ReadableAtom<any, any> & WritableAtom<any, any>);
export type AtomValueSetterArgs = Pick<StoreActions, 'peek' | 'set'>;
export type AtomValueSetter<UpdateValue, UpdateResult = void> = (setterArgs: AtomValueSetterArgs, updateValue: UpdateValue) => UpdateResult;
export type CreateReadableAtomOptions<Update> = {
    storeLabel?: string;
    onObserve?: [Update] extends [never] ? AtomOnObserve<never> : AtomOnObserve<Update>;
};
