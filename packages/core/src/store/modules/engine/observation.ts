import { resolveAtomOnObserve } from '../../../atom/utils';
import { DependentAtom, DependencyAtom, GettableAtom, OnObserveStoreApi } from '../../../types';
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
  markAtomAsObserved: <Value>(atom: GettableAtom<Value>) => void;
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
    atomState.dependencies?.forEach(possiblyUnobserveAtom);
  };

  const unobserveAtomQueue = createMicrotaskQueue<GettableAtom>(async (atomsToUnobserve) => {
    await ctx.recalculateDependentsQueue.getMicrotaskPromise();

    atomsToUnobserve.forEach(possiblyUnobserveAtom);
  });

  const markAtomAsObserved = <Value>(atom: GettableAtom<Value>): void => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    // Atom already observed.
    if (atomState.isObserved) {
      return;
    }
    // Mark dependencies as observed before marking given atom as observed.
    // TODO Should we actually revert it and set isObserved = true before iterating dependencies?
    atomState.dependencies?.forEach(markAtomAsObserved);
    atomState.isObserved = true;

    const onObserveStoreApi: OnObserveStoreApi = {
      peekAtom: (peekAtom) => ctx.readAtomValue(peekAtom, createAtomReadCycle(false)),
      setAtom: ctx.writeAtomValue,
    };

    const onObserveResult = resolveAtomOnObserve(atom, atomState.value, onObserveStoreApi);

    if (typeof onObserveResult === 'function') {
      atomState.onUnobserve = onObserveResult;
    }
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
