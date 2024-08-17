import {
  AtomValueSetter,
  MutableAtom,
  DerivedAtom,
  CallbackAtom,
  StoreActions,
  AtomValueGetterArgs,
  AtomValueSetterArgs,
} from "../types";
import {
  CreateAtomArgs,
  CreateCallbackAtomArgs,
  CreateDerivedAtomArgs,
  CreateMutableAtomArgs,
} from "./types";
import {
  isCreateCallbackAtomArgs,
  isCreateDerivedAtomArgs,
  isCreateMutableAtomArgs,
} from "./utils";

const defaultMutableAtomSetter = <Value>(_: AtomValueSetterArgs, value: Value) => value;

export function createAtom<Value, UpdateValue = Value>(
  args: CreateMutableAtomArgs<Value, UpdateValue>
): MutableAtom<Value, UpdateValue>;
export function createAtom<Value>(
  args: CreateDerivedAtomArgs<Value>
): DerivedAtom<Value>;
export function createAtom<UpdateValue, UpdateResult>(
  args: CreateCallbackAtomArgs<UpdateValue, UpdateResult>
): CallbackAtom<UpdateValue, UpdateResult>;
export function createAtom<ValueOrUpdateValue, UpdateValueOrUpdateResult>(
  args: CreateAtomArgs<
    ValueOrUpdateValue,
    ValueOrUpdateValue | UpdateValueOrUpdateResult,
    UpdateValueOrUpdateResult
  >
) {
  if (isCreateMutableAtomArgs(args)) {
    type Value = ValueOrUpdateValue;
    type UpdateValue = UpdateValueOrUpdateResult;

    const write: AtomValueSetter<UpdateValue, Value> =
      args.setter ?? defaultMutableAtomSetter as AtomValueSetter<UpdateValue, Value>

    return {
      write,
      initialValue: args.initialValue,
      onObserve: args.onObserve,
    } satisfies MutableAtom<Value, UpdateValue>;
  }

  if (isCreateDerivedAtomArgs(args)) {
    type Value = ValueOrUpdateValue;

    return {
      read: args.getter,
      onObserve: args.onObserve,
    } satisfies DerivedAtom<Value>;
  }

  if (isCreateCallbackAtomArgs(args)) {
    type UpdateValue = ValueOrUpdateValue;
    type UpdateResult = UpdateValueOrUpdateResult;

    return {
      write: args.setter,
    } satisfies CallbackAtom<UpdateValue, UpdateResult>;
  }

  throw new Error(
    "Failed to create atom as no required arguments were provided!"
  );
}

const t1 = createAtom<number, string>({
  initialValue: 0,
  onObserve: (set) => {},
});

const t2 = createAtom<string, number>({
  setter: ({}, val) => {
    return Number(val);
  },
});

const t3 = createAtom({
  getter: () => {
    return 2;
  },
});


const storeActions = {
  peek: () => {},
  set: () => {},
} as unknown as StoreActions;
const res = t2.write(storeActions, 2);
