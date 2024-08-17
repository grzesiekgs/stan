import {
  AtomValueSetter,
  MutableAtom,
  DerivedAtom,
  CallbackAtom,
  StoreActions,
} from "../types";
import {
  CreateAtomArgs,
  CreateCallbackAtomArgs,
  CreateComputedAtomArgs,
  CreateMutableAtomArgs,
} from "./types";
import {
  isCreateCallbackAtomArgs,
  isCreateComputedAtomArgs,
  isCreateMutableAtomArgs,
} from "./utils";

export function createAtom<Value, UpdateValue = Value>(
  args: CreateMutableAtomArgs<Value, UpdateValue>
): MutableAtom<Value, UpdateValue>;
export function createAtom<Value>(
  args: CreateComputedAtomArgs<Value>
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
      args.setter ?? ((storeActions, value) => value as unknown as Value);

    return {
      write,
      initialValue: args.initialValue,
      onSubscribe: args.onSubscribe,
    } satisfies MutableAtom<Value, UpdateValue>;
  }

  if (isCreateComputedAtomArgs(args)) {
    type Value = ValueOrUpdateValue;

    return {
      read: args.getter,
      onSubscribe: args.onSubscribe,
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
  onSubscribe: (set) => {},
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
