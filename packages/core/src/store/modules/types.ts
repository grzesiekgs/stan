import {
  AtomToStateMap,
  GettableAtom,
  ReadAtomValue,
  ScheduleWriteAtomValue,
  StoreGetAtomState,
  StoreSetAtom,
} from '../../types';

export type StateModule = {
  atomToStateMap: AtomToStateMap;
  getAtomState: StoreGetAtomState;
};

export type EngineModule = {
  readAtomValue: ReadAtomValue;
  writeAtomValue: StoreSetAtom;
  scheduleSet: ScheduleWriteAtomValue;
  unobserveAtom: (atom: GettableAtom) => void;
};
