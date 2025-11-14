export type AtomReadArgs = {
    get: StoreGetAtomValue;
    peek: StoreGetAtomValue;
    scheduleSet: ScheduleWriteAtomValue;
};
export type ReadAtom<Value> = (args: AtomReadArgs, atomState: AtomState<Value>) => Value;
export type AtomWriteArgs = {
    peek: StoreGetAtomValue;
    set: StoreSetAtomValue;
};
export type WriteAtom<UpdateValue, UpdateResult = UpdateValue> = (args: AtomWriteArgs, value: UpdateValue) => UpdateResult;
export type AtomOnObserve<Update> = [Update] extends [never] ? (args: {
    peek: StoreGetAtomValue;
}) => void | VoidFunction : (args: {
    peek: StoreGetAtomValue;
    setSelf: AtomSetSelf<Update>;
}) => void | VoidFunction;
export type ReadableAtomType = 'mutable' | 'derived' | 'observer';
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
export type AnyAtom = ReadableAtom<any, any> | WritableAtom<any, any> | (ReadableAtom<any, any> & WritableAtom<any, any>);
export type MutableAtom<Value, Update = Value> = ReadableAtom<Value, 'mutable'> & WritableAtom<Update, Value, 'mutable'> & {
    initialValue: Value;
};
export type DerivedAtom<Value, UpdateValue = never, UpdateResult = UpdateValue> = [
    UpdateValue
] extends [never] ? ReadableAtom<Value, 'derived'> : ReadableAtom<Value, 'derived'> & WritableAtom<UpdateValue, UpdateResult, 'derived'>;
export type ObserverAtom = ReadableAtom<void, 'observer'>;
export type CallbackAtom<UpdateValue, UpdateResult = void> = WritableAtom<UpdateValue, UpdateResult, 'callback'>;
export type DependentAtom<Value = any> = [Value] extends [never] ? ObserverAtom : DerivedAtom<Value, unknown, unknown>;
export type DependencyAtom<Value> = ReadableAtom<Value>;
export type StoreGetAtomValue = <Value>(atom: ReadableAtom<Value>) => Value;
export type StorePeekAtomValue = <Value>(atom: ReadableAtom<Value>) => Value;
export type StoreSetAtomValue = <Update, UpdateResult>(atom: WritableAtom<Update, UpdateResult>, update: Update) => UpdateResult;
export type StoreResetAtomState = <Value>(atom: ReadableAtom<Value>) => void;
export type StoreGetAtomState = <Value>(atom: ReadableAtom<Value>) => AtomState<Value>;
export type StoreObserveAtomValue = <Value>(atom: ReadableAtom<Value, any>, observer: ObserveAtomValue<Value>) => VoidFunction;
export type ReadAtomValue = <Value>(atom: ReadableAtom<Value>, observe?: boolean) => Value;
export type WriteAtomValue = <Update, UpdateResult>(atom: WritableAtom<Update, UpdateResult>, update: Update) => UpdateResult;
export type ScheduleWriteAtomValue = <Update, UpdateResult>(atom: WritableAtom<Update, UpdateResult>, update: Update) => void;
export type ObserveAtomValue<Value> = (value: Value) => void;
export type GetAtomValue<Value> = (atom: ReadableAtom<Value>) => Value;
export type BaseAtomState = {
    isObserved: boolean;
    onUnobserve: VoidFunction | undefined;
    dependencies: Set<DependencyAtom<unknown>> | undefined;
    dependents: Set<DependentAtom<unknown>> | undefined;
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
export type DependentAtomState<Value> = BaseAtomState & (InitialAtomState | {
    status: AtomStateStatus;
    value: Value;
});
export type MutableAtomState<Value> = BaseAtomState & {
    status: AtomStateStatus.FRESH;
    value: Value;
};
export type AtomState<Value> = InitialAtomState | DependentAtomState<Value> | MutableAtomState<Value>;
export type AtomStoreApi = {
    get: StoreGetAtomValue;
    peek: StoreGetAtomValue;
    set: StoreSetAtomValue;
    reset: StoreResetAtomState;
};
export type AtomToStateMap = WeakMap<ReadableAtom<any, any>, AtomState<any>>;
export type Store = {
    peekAtomValue: StorePeekAtomValue;
    observeAtomValue: StoreObserveAtomValue;
    setAtomValue: StoreSetAtomValue;
    resetAtomState: StoreResetAtomState;
    getAtomState: StoreGetAtomState;
};
export type AtomSetSelf<Value> = (value: Value) => void;
export type AtomValueGetterArgs = Pick<AtomStoreApi, 'get' | 'peek'>;
export type AtomValueGetter<Value> = (getterArgs: AtomValueGetterArgs) => Value;
export type AtomValueSetterArgs = Pick<AtomStoreApi, 'peek' | 'set'>;
export type AtomValueSetter<UpdateValue, UpdateResult = void> = (setterArgs: AtomValueSetterArgs, updateValue: UpdateValue) => UpdateResult;
export type CreateReadableAtomOptions<Update> = {
    storeLabel?: string;
    onObserve?: [Update] extends [never] ? AtomOnObserve<never> : AtomOnObserve<Update>;
};
