import { AtomToStateMap } from '../../types';
import { StateModule } from './types';
import { getAtomStateFromStateMap } from '../utils';

export const createStateModule = (): StateModule => {
  const atomToStateMap: AtomToStateMap = new WeakMap();

  return {
    atomToStateMap,
    getAtomState: (atom) => getAtomStateFromStateMap(atom, atomToStateMap),
  };
};
