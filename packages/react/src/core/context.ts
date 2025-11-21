import { StoreContext, RuntimeContext } from "./types";

// Persistent context
export const storeContext: StoreContext = {
  root: {
    container: null,
    node: null,
    instance: null,
  },
  hooks: new Map(),
  cleanupEffects: new Map(),
};

// Temporary context for each render
export const runtimeContext: RuntimeContext = {
  cursor: {
    path: null,
    index: 0,
  },
  workQueue: {
    domMutations: [],
    passiveEffects: [],
    cleanups: [],
  },
  componentStack: [],
  visited: new Set(),
};

export const resetRuntime = () => {
  runtimeContext.cursor.path = null;
  runtimeContext.cursor.index = 0;
  runtimeContext.workQueue.domMutations = [];
  runtimeContext.workQueue.passiveEffects = [];
  runtimeContext.workQueue.cleanups = [];
  runtimeContext.visited.clear();
};
