import { Store } from '../types';
import { createApiModule } from './modules/apiModule';
import { createEngineModule } from './modules/engine/createEngineModule';
import { createStateModule } from './modules/stateModule';

export const createStore = (): Store => {
  const state = createStateModule();
  (window as any).showState = () => console.log(state.atomToStateMap);

  const engine = createEngineModule(state);

  return createApiModule({ state, engine });
};
