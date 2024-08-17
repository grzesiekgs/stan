import {
  AtomValueGetter,
  AtomValueSetter,
  AtomValueSubscriber,
} from "../types";

export type CreateComputedAtomArgs<Value> = {
  getter: AtomValueGetter<Value>;
  onSubscribe?: AtomValueSubscriber<Value>;
};

export type CreateMutableAtomArgs<Value, UpdateValue> = {
  initialValue: Value;
  onSubscribe?: AtomValueSubscriber<Value>;
  setter?: AtomValueSetter<UpdateValue, Value>;
};

export type CreateCallbackAtomArgs<UpdateValue, UpdateResult> = {
  setter: AtomValueSetter<UpdateValue, UpdateResult>;
};

export type CreateAtomArgs<Value, UpdateValue, UpdateResult> =
  | CreateComputedAtomArgs<Value>
  | CreateMutableAtomArgs<Value, UpdateValue>
  | CreateCallbackAtomArgs<UpdateValue, UpdateResult>;
