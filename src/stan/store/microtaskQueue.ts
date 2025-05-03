export type MicrotaskQueue<Item> = {
  add: (item: Item /* | Item[] | Set<Item> */) => void;
  delete: (item: Item) => void;
  has: (item: Item) => boolean;
  microtaskPromise: null | Promise<void>;
};

export const createMicrotaskQueue = <Item>(
  microtaskCallback: (itemsSet: Set<Item>) => void | Promise<void>,
): MicrotaskQueue<Item> => {
  let microtaskPromise: null | Promise<void> = null;
  const itemsSet = new Set<Item>();

  const createMicrotaskPromise = () =>
    Promise.resolve().then(async () => {
      await microtaskCallback(itemsSet);

      itemsSet.clear();
      microtaskPromise = null;
    });

  return {
    add: (itemOrItems) => {
      // if (itemOrItems instanceof Set) {
      //   if (!itemOrItems.size) {
      //     return;
      //   }

      //   itemOrItems.forEach((item) => itemsSet.add(item));
      // } else if (Array.isArray(itemOrItems)) {
      //   if (!itemOrItems.length) {
      //     return;
      //   }

      //   itemOrItems.forEach((item) => itemsSet.add(item));
      // } else {
        itemsSet.add(itemOrItems);
      //}

      if (!microtaskPromise) {
        microtaskPromise = createMicrotaskPromise();
      }
    },
    delete: (item) => {
      itemsSet.delete(item);
    },
    has(item) {
      return itemsSet.has(item);
    },
    microtaskPromise,
  };
};
