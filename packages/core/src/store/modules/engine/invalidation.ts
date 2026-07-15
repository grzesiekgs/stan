import { AtomStateStatus, DependentAtom } from '../../../types';
import { createMicrotaskQueue, MicrotaskQueue } from '../../microtaskQueue';
import { createAtomReadCycle, getAtomStateFromStateMap } from '../../utils';
import { EngineBuildContext } from './context';

type InvalidationBuildResult = {
  recalculateDependentsQueue: MicrotaskQueue<DependentAtom<any>>;
  markDependentAtomForRecalculation: (
    atom: DependentAtom<any>,
    status: AtomStateStatus
  ) => void;
};

export const buildInvalidation = (ctx: EngineBuildContext): InvalidationBuildResult => {
  const { atomToStateMap } = ctx.state;

  const recalculateDependentsQueue = createMicrotaskQueue<DependentAtom<any>>(
    (dependentsToRecalculate) => {
      if (!dependentsToRecalculate.size) {
        console.warn('SANITY CHECK IS ACTUALLY NECESSARY??');
        return;
      }

      const alreadyProcessed = new Set<DependentAtom<any>>();

      dependentsToRecalculate.forEach((deriverAtom) => {
        if (alreadyProcessed.has(deriverAtom)) {
          console.warn('REPROCESSING DERIVER', deriverAtom.storeLabel);
        }

        const deriverAtomState = getAtomStateFromStateMap(deriverAtom, atomToStateMap);

        if (deriverAtomState.isObserved) {
          ctx.readAtomValue(deriverAtom, createAtomReadCycle(false));
        }

        alreadyProcessed.add(deriverAtom);
      });
    }
  );

  const markDependentAtomForRecalculation = (
    atom: DependentAtom<any>,
    status: AtomStateStatus
  ) => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
    // Atom A could be marked as stale, but could be also deriver of atom B which is being marked as stale,
    // and this could mark atom A as undetermined [look at end of this function].
    // Therefore make sure to not override undetermined status, to ensure that atom will be updated in recalculate phase.
    // This seems to apply only to derived atoms, therefore could be moved to derivedAtom.read (the IDEA for store modularization refactor).
    if (atomState.status !== AtomStateStatus.STALE) {
      atomState.status = status;
    }

    const added = recalculateDependentsQueue.pushItem(atom);
    // "added" is false when atom is already in queue.
    if (!added) {
      return;
    }

    // If atom did update, it's direct dependats are marked as stale, but it's uncertain does dependants of dependants actually have to update.
    atomState.dependents?.forEach((dependentAtom) =>
      markDependentAtomForRecalculation(dependentAtom, AtomStateStatus.UNDETERMINED)
    );
  };

  return { recalculateDependentsQueue, markDependentAtomForRecalculation };
};
