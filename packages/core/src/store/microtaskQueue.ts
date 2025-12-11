export type MicrotaskQueue<Item> = {
  pushItem: (item: Item /* | Item[] | Set<Item> */) => number;
  getMicrotaskPromise: () => undefined | Promise<void>;
  printStats: () => void;
};

export type MicrotaskStatus = 'pending' | 'processing' | 'finished';

export type MicrotaskCallback<Item> = (itemsSet: Set<Item>) => void | Promise<void>;

export type MicrotaskStepStats = {
  start: number;
  duration: number;
  items: number;
};

export type MicrotaskStats = {
  info: {
    id: number;
    counter: number;
  };
  items: {
    rejected: number;
    atStart: number;
    atEnd: number;
  };
  pending: MicrotaskStepStats;
  processing: MicrotaskStepStats;
};

let counter = 0;
export class Microtask<Item> {
  private itemsSet: Set<Item>;
  private status: MicrotaskStatus;
  private stats: MicrotaskStats;
  public promise: Promise<void>;
  public id: number;

  constructor(
    private microtaskCallback: MicrotaskCallback<Item>,
    previousMicrotask: Microtask<Item> | null
  ) {
    this.itemsSet = new Set<Item>();
    this.status = 'pending';
    this.id = performance.now();
    this.stats = {
      info: {
        id: this.id,
        counter: counter++,
      },
      items: {
        rejected: 0,
        atStart: 0,
        atEnd: 0,
      },
      pending: {
        start: performance.now(),
        duration: 0,
        items: 0,
      },
      processing: {
        start: 0,
        duration: 0,
        items: 0,
      },
    };

    if (previousMicrotask) {
      this.promise = previousMicrotask.promise.then(this.process);
    } else {
      // TODO What are the repercussions there?
      // Is this skipping one microtask due to "Promise.resolve" creating one promise (immediately resolved?)
      // and "then", creating another one?
      this.promise = Promise.resolve(this.itemsSet).then(this.process);
    }
  }

  private process = async (): Promise<void> => {
    // gather stats
    this.stats.items.atStart = this.itemsSet.size;
    this.stats.pending.duration = performance.now() - this.stats.pending.start;
    this.stats.pending.items = this.itemsSet.size;
    this.stats.processing.start = performance.now();

    this.status = 'processing';

    await this.microtaskCallback(this.itemsSet);
    // gather stats
    this.stats.items.atEnd = this.itemsSet.size;
    this.stats.processing.duration = performance.now() - this.stats.processing.start;
    this.stats.processing.items = this.itemsSet.size;

    this.status = 'finished';
    this.itemsSet.clear();
  };
  // Note that currently it's allowed to add item during microtask processing. Not sure is this legit.
  // My understanding is that it could happen only when called from within microtask processing, which "extends" current microtask.
  public add = (item: Item): boolean => {
    if (this.itemsSet.has(item)) {
      this.stats.items.rejected++;
      return false;
    }

    if (this.status === 'finished') {
      throw new Error('Tried to add item to finished microtask');
    }

    this.itemsSet.add(item);

    return true;
  };
  public getStats = (): MicrotaskStats => {
    return this.stats;
  };
}

export const createMicrotaskQueue = <Item>(
  microtaskCallback: MicrotaskCallback<Item>
): MicrotaskQueue<Item> => {
  let latestMicrotask: Microtask<Item> | null = null;
  // Any legit reasons to track this?
  // const microtasksQueue: Set<Microtask<Item>> = new Set();
  const microtasksStats: string[] = [];
  const api: MicrotaskQueue<Item> = {
    pushItem: (item) => {
      if (latestMicrotask) {
        latestMicrotask.add(item);

        return latestMicrotask.id;
      }

      const newMicrotask = new Microtask<Item>(async (items: Set<Item>) => {
        await microtaskCallback(items);

        if (newMicrotask === latestMicrotask) {
          latestMicrotask = null;
        }
        console.log('MICROTASK FINISHED', newMicrotask.getStats());
        microtasksStats.push(JSON.stringify(newMicrotask.getStats()));
      }, latestMicrotask);

      latestMicrotask = newMicrotask;

      newMicrotask.add(item);

      return newMicrotask.id;
    },
    getMicrotaskPromise: () => latestMicrotask?.promise,
    printStats: () => microtasksStats,
  };

  return api;
};
