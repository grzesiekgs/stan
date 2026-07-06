import { AtomValueGetter, AtomOnObserve, StoreActions } from '../types';

export type AtomValueSetterArgs = Pick<StoreActions, 'peek' | 'set'>;
export type AtomValueSetter<UpdateValue, UpdateResult = void> = (
  setterArgs: AtomValueSetterArgs,
  updateValue: UpdateValue
) => UpdateResult;


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
