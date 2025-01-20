import {
  MutableAtom,
  DerivedAtom,
  CallbackAtom,
  StoreActions,
  WriteAtom,
  ReadAtom,
} from '../types';
import {
  CreateAtomArgs,
  CreateCallbackAtomArgs,
  CreateDerivedAtomArgs,
  CreateMutableAtomArgs,
} from './types';
import {
  isCreateCallbackAtomArgs,
  isCreateDerivedAtomArgs,
  isCreateMutableAtomArgs,
} from './utils';

const defaultWrite: WriteAtom<any, any> = (args, value) => value;
const defaultRead: ReadAtom<any> = (args, atomState) => {
  if (!atomState.isInitialized) {
    throw Error('Default reader applied to derived atom!');
  }

  return atomState.value;
};

export function createAtom<Value>(
  args: CreateMutableAtomArgs<Value, Value> | CreateDerivedAtomArgs<Value>
): typeof args extends CreateDerivedAtomArgs<Value>
  ? MutableAtom<Value, Value>
  : DerivedAtom<Value>;
export function createAtom<Value, UpdateValue>(
  args: CreateMutableAtomArgs<Value, UpdateValue>
): MutableAtom<Value, UpdateValue>;
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
  if (isCreateCallbackAtomArgs(args)) {
    type UpdateValue = ValueOrUpdateValue;
    type UpdateResult = UpdateValueOrUpdateResult;

    const callbackAtom: CallbackAtom<UpdateValue, UpdateResult> = {
      write: args.setter,
    };

    return callbackAtom;
  }

  const label: string = args.label ?? crypto.randomUUID();

  if (isCreateMutableAtomArgs(args)) {
    type Value = ValueOrUpdateValue;
    type UpdateValue = UpdateValueOrUpdateResult;

    const mutableAtom: MutableAtom<Value, UpdateValue> = {
      read: defaultRead,
      write: args.setter ?? defaultWrite,
      initialValue: args.initialValue,
      onObserve: args.onObserve,
      label,
    };

    return mutableAtom;
  }

  if (isCreateDerivedAtomArgs(args)) {
    type Value = ValueOrUpdateValue;
    const derivedAtom: DerivedAtom<Value> = {
      read: args.getter,
      onObserve: args.onObserve,
      label,
    };

    return derivedAtom;
  }

  throw new Error('Failed to create atom as no required arguments were provided!');
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
const res = t2.write(storeActions, String(2));
