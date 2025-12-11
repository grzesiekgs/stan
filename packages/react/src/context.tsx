import { createStore, Store } from '@stan/core';
import { createContext, FC, PropsWithChildren, useContext, useState } from 'react';

export const StanStoreContext = createContext<Store | null>(null);

export const StoreProvider: FC<PropsWithChildren<{ store?: Store }>> = ({ store, children }) => {
  const [storeValue] = useState<Store>(() => store ?? createStore());

  return <StanStoreContext.Provider value={storeValue}>{children}</StanStoreContext.Provider>;
};

export const useStore = () => {
  const store = useContext(StanStoreContext);

  if (!store) {
    throw new Error('@stan/react: Store not found. Make sure to initialize StoreProvider.');
  }

  (globalThis as any).stanStore = store;

  return store;
};
