
import { createDerivedAtom } from '../createAtom/createAtom';
import { isDerivedAtom, isMutableAtom, isWritableAtom } from '../createAtom/utils';
import {
  AtomOnObserve,
  AtomReadArgs,
  AtomState,
  AtomToStateMap,
  AtomWriteArgs,
  DerivedAtom,
  ReadableAtom,
  Store,
  StoreValueGetter,
  StoreValueScheduledSetter,
  StoreValueSetter,
  WritableAtom,
} from '../types';
import { createDerivedAtomGetter, getAtomStateFromStateMap } from './utils';

export const createStore = (): Store => {
  const atomToStateMap: AtomToStateMap = new WeakMap();
  (window as any).showState = () => console.log(atomToStateMap);
  const deriversToRecalculate: Set<DerivedAtom<any, any, any>> = new Set();
  let recalculatePromise: null | Promise<void> = null;
  const recalculateDerivers = () => {
    if (!deriversToRecalculate.size) {
      console.warn('No derivers to recalc??');
    }
    // TODO This could possibly be optimized, because right now set has to be sorted and then array has to be iterated over.
    const orderedDeriversToRecalculate: DerivedAtom<any, any, any>[] = [];
    const start = performance.now();
    const start1 = Date.now();

    deriversToRecalculate.forEach((deriverAtom) => {
      const deriverAtomState = getAtomStateFromStateMap(deriverAtom, atomToStateMap);
      const orderedDeriverOfDeriverIndex = orderedDeriversToRecalculate.findIndex(
        (orderedDeriver) => deriverAtomState.derivers?.has(orderedDeriver)
      );

      if (orderedDeriverOfDeriverIndex > -1) {
        orderedDeriversToRecalculate.splice(orderedDeriverOfDeriverIndex, 0, deriverAtom);
      } else {
        orderedDeriversToRecalculate.push(deriverAtom);
      }
    });

    // NOTE 'get' might be triggered for unobsered or fresh atom. Not sure should just ignore it?
    orderedDeriversToRecalculate.forEach(get);

    deriversToRecalculate.clear();
    recalculatePromise = null;
    console.log(performance.now() - start, Date.now() - start1);
  };
  // Optimistically mark derivers for recalculation.
  // They will get recalculated only if marked as not fresh.
  // They could be marked during scueduled recalculate.
  const markAtomDeriversForRecalculation = (atom: ReadableAtom<any, any>) => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    
    if (atomState.derivers) {
      const derivers = atomState.derivers;
      // TODO Just debug, should not happen. Remove later if will not occur.
      if (!derivers.size) {
        console.warn('No derivers to recalculate!', atom.storeLabel);
      }
      // Mark atom and it's derivers for recalculation.
      // Ignore order as it will be tahen care of in recalculateDerivers.
      derivers.forEach((deriverAtom) => {
        deriversToRecalculate.add(deriverAtom);

        markAtomDeriversForRecalculation(deriverAtom);
      });
      // OUTDATED
      // Add each deriver to recalculation set, and then recure call this function for each of derivers.
      // TODO There might be needed some more advanced thing.
      // Use two separate forEach calls, in order to prioritize update of currently processed derivers,
      // as they are deeper in derivers tree.
      // TODO Could use Set.intersection but it's quite fresh addition to ES, use it anyway?
      // derivers.forEach((deriverAtom) => deriversToRecalculate.add(deriverAtom));
      //derivers.forEach(markAtomDeriversForRecalculation);
    }
  };

  const scheduleRecalculateAtomDerivers = () => {
    recalculatePromise = recalculatePromise ?? Promise.resolve().then(recalculateDerivers);
  };
  // TODO Whats the point of returning value there? Most likely combine it with 'read' or split.
  const updateAtomValue = <Value>(atom: ReadableAtom<Value, any>, value: Value): void => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);

    atomState.isFresh = true;
    // Skip update if value did not change.
    if (atomState.value === value) {
      return;
    }

    atomState.value = value;
    
    if (!atomState.derivers) {
      return
    }
    // Make sure to update all observed derivers.
    // Mark direct derivers as not fresh. They will need to recalculate efectivelly calling this function, and marking their derivers as not fresh.
    atomState.derivers.forEach((deriverAtom) => {
      const deriverAtomState = getAtomStateFromStateMap(deriverAtom, atomToStateMap);

      deriverAtomState.isFresh = false;
    });
    atomState.derivers = undefined;
  
  };

  const possiblyStartObservingAtom = (atom: ReadableAtom<any, any>, atomState: AtomState<any>) => {
    if (atomState.isObserved) {
      return; 
    }

    atomState.isObserved = true;

    const { onObserve } = atom;
    
    if (!onObserve) {
      return;
    }
    // Atom that is not writable, doesn't have access to callSet in onObserve.
    if (isWritableAtom(atom)) {
      // Note that callSet returns void, this could be changed to returning setter result.
      onObserve({ peek, callSet: (value) => {
        set(atom, value);
      } });
    } else {
      (onObserve as AtomOnObserve<never>)({ peek });
    }
  }

  const possiblyStopObservingAtom = (atom: ReadableAtom<any, any>, atomState: AtomState<any>) => {
    return;
  }
  // TODO Unify get with peek? How to deal with isObserved?
  const get: StoreValueGetter = (atom) => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    // When to mark atom as not observed??
    possiblyStartObservingAtom(atom, atomState);
    // When state is marked as fresh, theres was no update since last read, therefore return value.
    if (atomState.isFresh) {
      return atomState.value;
    }
    
    // Safety check to satisfy TS, mutable atom is always frash.
    if (!isDerivedAtom(atom)) {
      throw new Error(
        'Somehow MutableAtom has been marked as not fresh! This shouldn`t be possible!'
      );
    }
    
    // Create getter which will mark current atom as deriver of it's dependencies.
    const value = atom.read(
      { get: createDerivedAtomGetter(atom, atomToStateMap, get), peek, scheduleSet  },
      atomState
    );

    updateAtomValue(atom, value);

    return value;
  };
  // Seems like the only difference between 'get' and 'peek' should be that 'peek' should not start observing atom that is being read.
  // Still, when we are reading derived atom, it should subscribe to it's dependencies, which (right now) would mark atom as being observed,
  // (see possiblyStartObservingAtom in 'get'), which is not correct.
  // Atom should be marked as observed only if it (or any of it's derivers) is marked as observed.
  // Therefore, seems like 'get' should accept additional argument, which will control observability, and will be passed to createDerivedAtomGetter.
  const peek: StoreValueGetter = (atom) => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    // When state is marked as fresh, theres no question asked, just return value.
    if (atomState.isFresh) {
      return atomState.value;
    }

    if (!isDerivedAtom(atom)) {
      throw new Error(
        'Somehow MutableAtom has been marked as not fresh! This shouldn`t be possible!'
      );
    }
    // TODO Explain how `peek` is different from `get`.
    const value = atom.read(
      { get: createDerivedAtomGetter(atom, atomToStateMap, get), peek, scheduleSet },
      atomState
    );

    updateAtomValue(atom, value);

    return value;
  };

  const set: StoreValueSetter = (atom, update) => {
    const value = atom.write(atomWriteArgs, update);
    
    if (isMutableAtom(atom)) {
      // NOTE Schedule recalculate before derivers are marked for recalculation.
      // Not 100% sure is this good idea.
      scheduleRecalculateAtomDerivers();
      markAtomDeriversForRecalculation(atom);
      // Update value at the end, because it will clear atom derivers.
      updateAtomValue(atom, value);
    }

    return value;
  };

  const scheduleSet: StoreValueScheduledSetter = (atom, update) => {
    Promise.resolve().then(() => set(atom, update));
  };

  const atomReadArgs: AtomReadArgs = { peek, get, scheduleSet };
  const atomWriteArgs: AtomWriteArgs = { peek, set };
  const storeApi: Store = {
    peekAtom: peek,
    setAtom: set,
    observeAtom(atom, listener) {
      const observerAtom = createDerivedAtom(({ get }) => listener(get(atom)), undefined, {
        storeLabel: `observerOf${atom.storeLabel}`,
      });
      get(observerAtom);
      // Pretend that observerAtom is observed by some entity, so it will recalculate on deps change.
      // getAtomStateFromStateMap(observerAtom, atomToStateMap).isObserved = true;
      return () => {
        // TODO How to unobserve??? When to reset it?? Maybe reset isObserved and derivers on deriversUpdate???
        getAtomStateFromStateMap(observerAtom, atomToStateMap).isObserved = false;
        // possiblyStopObservingAtom(observerAtom)
        storeApi.resetAtom(observerAtom);
      };
    },
    resetAtom(atom) {
      // TODO Consider checking is atom actually mounted. (what for??)
    },
  };

  return storeApi;
};
