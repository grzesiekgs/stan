import {
  CreateAtomArgs,
  CreateCallbackAtomArgs,
  CreateComputedAtomArgs,
  CreateMutableAtomArgs,
} from "./types";

export const isCreateMutableAtomArgs = <Value, UpdateValue>(
  args: CreateAtomArgs<Value, UpdateValue, any>
): args is CreateMutableAtomArgs<Value, UpdateValue> => "initialValue" in args;

export const isCreateComputedAtomArgs = <Value>(
  args: CreateAtomArgs<Value, any, any>
): args is CreateComputedAtomArgs<Value> => "getter" in args;

export const isCreateCallbackAtomArgs = <UpdateValue, UpdateResult>(
  args: CreateAtomArgs<never, UpdateValue, UpdateResult>
): args is CreateCallbackAtomArgs<UpdateValue, UpdateResult> =>
  "setter" in args;
