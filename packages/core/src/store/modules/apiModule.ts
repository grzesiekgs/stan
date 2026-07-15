import { createObserverAtom } from '../../atom/createAtom';
import { Store } from '../../types';
import { createAtomReadCycle } from '../utils';
import { EngineModule, StateModule } from './types';

type CreateApiModuleArgs = {
  state: StateModule;
  engine: EngineModule;
};

export const createApiModule = ({ state, engine }: CreateApiModuleArgs): Store => {
  const storeApi: Store = {
    peekAtom: (atom) => engine.readAtomValue(atom, createAtomReadCycle(false)),
    setAtom: engine.writeAtomValue,
    observeAtom(atom, listener) {
      // Create a wrapper observer which triggers the listener when atom value changes.
      const observerAtom = createObserverAtom(
        ({ get }) => {
          const value = get(atom);

          listener(value);
        },
        {
          storeLabel: `observer[${atom.storeLabel}]`,
        }
      );
      // Mark observer as observed, so it will keep receiving updates until unobserved.
      engine.readAtomValue(observerAtom, createAtomReadCycle(true));

      return () => {
        engine.unobserveAtom(observerAtom);
      };
    },
    resetAtomState(atom) {
      console.log('RESET ATOM', atom.storeLabel);
      // TODO Unmount -> reset in store -> mount if was previously mounted and restore derivers????
    },
    getAtomState: state.getAtomState,
    peekAtomToStateMap: () => state.atomToStateMap,
  };

  return storeApi;
};
