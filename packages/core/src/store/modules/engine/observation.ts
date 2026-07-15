import { resolveAtomOnObserve } from '../../../atom/utils';
import { isObserverAtom } from '../../../atom/guards';
import {
  AtomOnUnobserve,
  AtomReadCycle,
  AtomState,
  DependentAtom,
  DependencyAtom,
  GettableAtom,
  OnObserveStoreApi,
} from '../../../types';
import { isValuePresent } from '../../../utils/isValuePresent';
import { createMicrotaskQueue, MicrotaskQueue } from '../../microtaskQueue';
import {
  createAtomReadCycle,
  getAtomStateFromStateMap,
  getDependenciesToUnobserve,
  removeAtomDependent,
} from '../../utils';
import { EngineBuildContext } from './context';

type ObservationBuildResult = {
  unobserveAtomQueue: MicrotaskQueue<GettableAtom>;
  markAtomAsObserved: <Value>(
    atom: GettableAtom<Value>,
    atomState: AtomState<Value>,
    readCycle: AtomReadCycle
  ) => void;
  unlinkAtomPreviousDependencies: (
    atom: DependentAtom<any>,
    previousDependencies?: Set<DependencyAtom<any>>,
    currentDependencies?: Set<DependentAtom<any>>
  ) => void;
};

export const buildObservation = (ctx: EngineBuildContext): ObservationBuildResult => {
  const { atomToStateMap } = ctx.state;

  const possiblyUnobserveAtom = (atom: GettableAtom) => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    const hasObservedDependents = Array.from(atomState.dependents ?? []).some(
      (dependentAtom) => getAtomStateFromStateMap(dependentAtom, atomToStateMap).isObserved
    );
    // Atom is still observed by other atom.
    if (hasObservedDependents) {
      return;
    }

    atomState.onUnobserve?.(atomState.value);
    atomState.isObserved = false;
    atomState.onUnobserve = undefined;
    atomState.dependencies?.forEach(possiblyUnobserveAtom);
  };

  const unobserveAtomQueue = createMicrotaskQueue<GettableAtom>(async (atomsToUnobserve) => {
    await ctx.recalculateDependentsQueue.getMicrotaskPromise();

    atomsToUnobserve.forEach(possiblyUnobserveAtom);
  });

  const runAtomOnObserve = (
    atom: GettableAtom<any>,
    atomState: AtomState<any>,
    onObserveStoreApi: OnObserveStoreApi
  ): void => {
    let onObserveResult: void | AtomOnUnobserve<any>;

    if (isObserverAtom(atom)) {
      onObserveResult = atom.onObserve?.({ peek: onObserveStoreApi.peekAtom }, undefined);
    } else {
      const atomValue = atomState.value;

      if (!isValuePresent(atomValue)) {
        throw new Error(`Atom ${atom.storeLabel} has no initialized value on observe`);
      }

      onObserveResult = resolveAtomOnObserve(atom, atomValue, onObserveStoreApi);
    }

    atomState.onUnobserve = typeof onObserveResult === 'function' ? onObserveResult : undefined;
  };

  const markAtomAsObserved = <Value>(
    atom: GettableAtom<Value>,
    atomState: AtomState<Value>,
    readCycle: AtomReadCycle
  ): void => {
    // Atom already observed.
    if (atomState.isObserved) {
      return;
    }

    atomState.dependencies?.forEach((dependencyAtom) => {
      const dependencyAtomState = getAtomStateFromStateMap(dependencyAtom, atomToStateMap);

      if (!dependencyAtomState.isObserved) {
        ctx.readAtomValue(dependencyAtom, createAtomReadCycle(true, readCycle.chain));
      }
    });

    atomState.isObserved = true;

    const onObserveStoreApi: OnObserveStoreApi = {
      peekAtom: (peekAtom) => ctx.readAtomValue(peekAtom, createAtomReadCycle(false)),
      setAtom: ctx.writeAtomValue,
    };

    runAtomOnObserve(atom, atomState, onObserveStoreApi);
  };

  const unlinkAtomPreviousDependencies = (
    atom: DependentAtom<any>,
    previousDependencies?: Set<DependencyAtom<any>>,
    currentDependencies?: Set<DependentAtom<any>>
  ) => {
    const dependenciesToUnobserve = getDependenciesToUnobserve(
      previousDependencies,
      currentDependencies
    );

    dependenciesToUnobserve?.forEach((dependencyAtom) => {
      const dependencyAtomState = getAtomStateFromStateMap(dependencyAtom, atomToStateMap);

      removeAtomDependent(dependencyAtomState, atom);

      unobserveAtomQueue.pushItem(dependencyAtom);
    });
  };

  return { unobserveAtomQueue, markAtomAsObserved, unlinkAtomPreviousDependencies };
};
