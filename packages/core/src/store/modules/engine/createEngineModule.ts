import { StateModule, EngineModule } from '../types';
import { buildInvalidation } from './invalidation';
import { buildObservation } from './observation';
import { buildReadWrite } from './read-write';
import { EngineBuildContext } from './context';

export const createEngineModule = (state: StateModule): EngineModule => {
  // Build order is load-bearing: invalidation → observation → read-write.
  // Cross-builder ctx fields are only invoked lazily (microtasks / observed reads).
  const ctx = { state } as EngineBuildContext;

  Object.assign(ctx, buildInvalidation(ctx));
  Object.assign(ctx, buildObservation(ctx));
  Object.assign(ctx, buildReadWrite(ctx));

  (globalThis as any).mcQueue = ctx.recalculateDependentsQueue;

  return {
    readAtomValue: ctx.readAtomValue,
    writeAtomValue: ctx.writeAtomValue,
    scheduleSet: ctx.scheduleSet,
    unobserveAtom: (atom) => ctx.unobserveAtomQueue.pushItem(atom),
  };
};
