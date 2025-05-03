export type MicrotaskQueue<Item> = {
    add: (item: Item) => void;
    delete: (item: Item) => void;
    has: (item: Item) => boolean;
    microtaskPromise: null | Promise<void>;
};
export declare const createMicrotaskQueue: <Item>(microtaskCallback: (itemsSet: Set<Item>) => void | Promise<void>) => MicrotaskQueue<Item>;
