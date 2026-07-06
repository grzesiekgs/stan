
export type AtomReadArgs = {
  get: StoreValueGetter;
  peek: StoreValueGetter;
  scheduleSet: StoreValueScheduledSetter;
};
export type ReadAtom<Value> = (args: AtomReadArgs, atomState: AtomState<Value>) => Value;

export type AtomWriteArgs = { peek: StoreValueGetter; set: StoreValueSetter };
export type AtomWrite<UpdateValue, UpdateResult> = (
  args: AtomWriteArgs,
  value: UpdateValue
) => UpdateResult;


export type WritableAtom<UpdateValue, UpdateResult> = {
  write: AtomWrite<UpdateValue, UpdateResult>;
};

export type DerivedAtom<Value> = ReadableAtom<Value>;
export type MutableAtom<Value, UpdateValue = Value, UpdateResult = UpdateValue> = DerivedAtom<Value> & WritableAtom<UpdateValue, UpdateResult>
export type CallbackAtom<UpdateValue, UpdateResult = void> = WritableAtom<UpdateValue, UpdateResult>;