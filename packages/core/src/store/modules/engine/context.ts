import {
  AtomStateStatus,
  DependentAtom,
  DependencyAtom,
  GettableAtom,
  ReadAtomValue,
  ScheduleWriteAtomValue,
  StoreSetAtom,
} from '../../../types';
import { MicrotaskQueue } from '../../microtaskQueue';
import { StateModule } from '../types';

export type EngineBuildContext = {
  state: StateModule;
  readAtomValue: ReadAtomValue;
  writeAtomValue: StoreSetAtom;
  scheduleSet: ScheduleWriteAtomValue;
  recalculateDependentsQueue: MicrotaskQueue<DependentAtom<any>>;
  markDependentAtomForRecalculation: (
    atom: DependentAtom<any>,
    status: AtomStateStatus
  ) => void;
  markAtomAsObserved: <Value>(atom: GettableAtom<Value>) => void;
  unlinkAtomPreviousDependencies: (
    atom: DependentAtom<any>,
    previousDependencies?: Set<DependencyAtom<any>>,
    currentDependencies?: Set<DependentAtom<any>>
  ) => void;
  unobserveAtomQueue: MicrotaskQueue<GettableAtom>;
};
