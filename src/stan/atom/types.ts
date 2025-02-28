import { AtomValueGetter, AtomValueSetter, AtomOnObserve } from '../types';

export type CreateDerivedAtomArgs<Value> = {
  label?: string;
  getter: AtomValueGetter<Value>;
  onObserve?: AtomOnObserve<Value>;
  initialValue?: never;
};

export type CreateMutableAtomArgs<Value, UpdateValue> = {
  label?: string;
  initialValue: Value;
  onObserve?: AtomOnObserve<Value>;
  setter?: AtomValueSetter<UpdateValue, Value>;
  getter?: never;
};

export type CreateCallbackAtomArgs<UpdateValue, UpdateResult> = {
  setter: AtomValueSetter<UpdateValue, UpdateResult>;
};

export type CreateAtomArgs<Value, UpdateValue, UpdateResult> =
  | CreateDerivedAtomArgs<Value>
  | CreateMutableAtomArgs<Value, UpdateValue>
  | CreateCallbackAtomArgs<UpdateValue, UpdateResult>;
