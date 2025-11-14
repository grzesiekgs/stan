import { createStore, Store } from "@stan/core";
import { createContext, FC, PropsWithChildren, useContext, useState } from "react";

export const StoreContext = createContext<Store | null>(null);

export const StoreProvider: FC<PropsWithChildren<{ store?: Store }>> = ({ store, children }) => {
  const [storeValue] = useState<Store>(() => store ?? createStore());

  return <StoreContext.Provider value={storeValue}>{children}</StoreContext.Provider>
}

export const useStore = () => {
  const store = useContext(StoreContext);

  if (!store) {
    throw new Error('@stan/react: Store not found. Make sure to initialize StoreProvider.');
  }

  return store;
}