import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { isStatefulAtom, isWritableAtom } from './stan/atom/utils';
import { Atom } from './stan/types';
import { testStore } from './testStore';

type InnerUpdate<Value, Result> = (update: Value) => Result;
type AtomUpdater<Value, Result> = (update: InnerUpdate<Value, Result>) => Result;

const buildSyncExternalStoreArgs = <
  Value,
  UpdateValue,
  UpdateResult extends [Value] extends [never] ? any : Value
>(
  atom: Atom<Value, UpdateValue, UpdateResult>
): [(callback: VoidFunction) => VoidFunction, () => Value] => {
  if (isStatefulAtom(atom)) {
    return [
      (callback) => testStore.observeAtom(atom, callback),
      () => {
        const res = testStore.peekAtom(atom);

        return res as Value;
      },
    ];
  }
  console.warn('Tries to subscribe to non-readable atom');
  return [() => () => undefined, () => null as Value];
};

export const useAtomValue = <
  Value,
  UpdateValue,
  UpdateResult extends [Value] extends [never] ? any : Value
>(
  atom: Atom<Value, UpdateValue, UpdateResult>
): Value => {
  const [subscribe, getSnapshot] = useMemo(() => buildSyncExternalStoreArgs(atom), [atom]);
  const value = useSyncExternalStore(subscribe, getSnapshot);
  // TODO Throw error to simplify types?
  return value;
};

export const useSetAtomValue = <
  Value,
  UpdateValue,
  UpdateResult extends [Value] extends [never] ? any : Value
>(
  atom: Atom<Value, UpdateValue, UpdateResult>
): AtomUpdater<UpdateValue, UpdateResult> =>
  useCallback<AtomUpdater<UpdateValue, UpdateResult>>(
    (possiblyUpdate): UpdateResult => {
      // TODO Throw error to simplify types?
      if (!isWritableAtom(atom)) {
        throw new Error('Tried to write non-writable atom');
      }

      const update =
        typeof possiblyUpdate === 'function'
          ? possiblyUpdate(testStore.peekAtom(atom))
          : possiblyUpdate;

      return testStore.setAtom(atom, update) as UpdateResult;
    },
    [atom]
  );

export const useAtom = <
  Value,
  UpdateValue,
  UpdateResult extends [Value] extends [never] ? any : Value
>(
  atom: Atom<Value, UpdateValue, UpdateResult>
): [Value, AtomUpdater<UpdateValue, UpdateResult>] => {
  const value = useAtomValue(atom);
  const setValue = useSetAtomValue(atom);

  return [value, setValue];
};
