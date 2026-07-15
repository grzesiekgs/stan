import {
  isDependentAtom,
  isMutableAtom,
  isCallbackAtom,
  isDerivedAtom,
  isSettableAtom,
} from '../../../atom/guards';
import {
  AtomStateStatus,
  GettableAtom,
  ReadAtomValue,
  ScheduleWriteAtomValue,
  SettableAtom,
  SettableAtomDerivedValue,
  SettableAtomType,
  StoreSetAtom,
} from '../../../types';
import {
  addAtomDependency,
  addAtomDependent,
  createAtomReadCycle,
  getAtomStateFromStateMap,
} from '../../utils';
import { EngineBuildContext } from './context';

type ReadWriteBuildResult = {
  readAtomValue: ReadAtomValue;
  writeAtomValue: StoreSetAtom;
  scheduleSet: ScheduleWriteAtomValue;
};

export const buildReadWrite = (ctx: EngineBuildContext): ReadWriteBuildResult => {
  const { atomToStateMap } = ctx.state;

  const updateAtomValue = <Value>(atom: GettableAtom<Value, any>, value: Value): void => {
    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);

    atomState.status = AtomStateStatus.FRESH;
    // Skip update if value did not change.
    if (atomState.value === value) {
      return;
    }
    // Since atom value updated, then value of direct dependents is stale until it will be recalculated.
    atomState.dependents?.forEach((dependentAtom) =>
      ctx.markDependentAtomForRecalculation(dependentAtom, AtomStateStatus.STALE)
    );
    // Set new value, and clear dependents since each atom value requires separate list of dependents.
    atomState.value = value;
    atomState.dependents = undefined;
  };

  const readAtomValue: ReadAtomValue = (atom, readCycle) => {
    if (readCycle.chain.has(atom)) {
      throw new Error(`Cycle detected in read chain: ${atom.storeLabel}`);
    }

    readCycle.chain.add(atom);

    const atomState = getAtomStateFromStateMap(atom, atomToStateMap);

    if (readCycle.observed) {
      ctx.markAtomAsObserved(atom);
    }

    // When state is marked as fresh, theres was no update since last read, therefore return value.
    if (atomState.status === AtomStateStatus.FRESH) {
      return atomState.value;
    }

    // Sanity check. Only mutable atom is always fresh.
    if (!isDependentAtom(atom)) {
      throw new Error(
        `Somehow MutableAtom has been marked as not fresh! This shouldn't be possible! - ${atom.storeLabel}`
      );
    }
    // If atom updated, it's direct dependants are marked as STALE,
    // but dependants of dependants are marked as UNDETERMINED as we are actually not certain do we have to recalculate these.
    // Therefore traverse dependencies in search of STALE atom, if such atom will be found,
    // it will recalculate, and mark all of direct dependants as STALE. Process will repeat from bottom of dependency tree to this atom,
    // effectively marking atoms as STALE on the way.
    if (atomState.status === AtomStateStatus.UNDETERMINED) {
      // Don't reuse cycle for prewarming. Cycle will be reused few lines later, if it will be decided that atom hs to recalculate.
      atomState.dependencies?.forEach((dependencyAtom) =>
        readAtomValue(dependencyAtom, createAtomReadCycle(false))
      );
      // Since dependency tree was traversed, and atom is still UNDETERMINED (not STALE),
      // it means that atom didn't have to recalculate as result of updating dependency.
      if (atomState.status === AtomStateStatus.UNDETERMINED) {
        atomState.status = AtomStateStatus.FRESH;

        return atomState.value;
      }
    }
    // Save and clear dependencies before reading atom value,
    // then compare new dependencies with saved ones,
    // to determine atoms which possibly should be unobserved.
    const previousDependencies = atomState.dependencies;
    atomState.dependencies = undefined;

    const value = atom.read(
      {
        get: (dependencyAtom) => {
          const sourceAtomValue = readAtomValue(
            dependencyAtom,
            createAtomReadCycle(readCycle.observed, readCycle.chain) // Create new read chain, using previous chain.
          );
          const sourceAtomState = getAtomStateFromStateMap(dependencyAtom, atomToStateMap);
          // Note that subscription happens after sourceAtom has been updated in store.
          addAtomDependency(atomState, dependencyAtom);
          addAtomDependent(sourceAtomState, atom);

          return sourceAtomValue;
        },
        peek: (peekAtom) => readAtomValue(peekAtom, createAtomReadCycle(false)),
        // TODO Expose scheduleSet just for observer atom? (not introduced yet)
        scheduleSet,
      },
      atomState.value
    );

    ctx.unlinkAtomPreviousDependencies(atom, previousDependencies, atomState.dependencies);
    updateAtomValue(atom, value);

    return value;
  };

  const writeAtomValue: StoreSetAtom = <
    Update,
    UpdateResult,
    AtomType extends SettableAtomType,
    TrackedValue extends SettableAtomDerivedValue<
      AtomType,
      UpdateResult
    > = SettableAtomDerivedValue<AtomType, UpdateResult>,
  >(
    atom: SettableAtom<Update, UpdateResult, AtomType, TrackedValue>,
    update: Update
  ): UpdateResult => {
    if (isMutableAtom(atom)) {
      const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
      const value = atom.write(
        { peek: (peekAtom) => readAtomValue(peekAtom, createAtomReadCycle(false)) },
        update,
        atomState.value
      );

      updateAtomValue(atom, value);

      return value;
    }

    const callbackArgs = {
      peek: (peekAtom: GettableAtom) => readAtomValue(peekAtom, createAtomReadCycle(false)),
      set: writeAtomValue,
    };

    if (isCallbackAtom(atom)) {
      return atom.callback(callbackArgs, update);
    }

    if (isSettableAtom(atom) && isDerivedAtom(atom)) {
      const atomState = getAtomStateFromStateMap(atom, atomToStateMap);

      return atom.callback(callbackArgs, update, atomState.value);
    }

    throw new Error(`Atom is not settable: ${atom}`);
  };

  const scheduleSet: ScheduleWriteAtomValue = (atom, update) => {
    Promise.resolve().then(() => writeAtomValue(atom, update));
  };

  return { readAtomValue, writeAtomValue, scheduleSet };
};
