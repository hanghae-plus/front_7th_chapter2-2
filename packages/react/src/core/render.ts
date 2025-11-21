import { storeContext, runtimeContext, resetRuntime } from "./context";
import { reconcile } from "./reconciler";
import { cleanupUnusedHooks } from "./hooks";
import { commitMutations } from "./commit";
import { flushPassiveEffects } from "./scheduler";
import { withEnqueue, enqueue } from "../utils";

const ROOT_PATH = "root";

export const render = (): void => {
  // reset runtime context
  resetRuntime();

  // reconcile
  const oldInstance = storeContext.root.instance;
  const newInstance = reconcile(
    storeContext.root.container as HTMLElement,
    oldInstance,
    storeContext.root.node,
    ROOT_PATH,
  );
  storeContext.root.instance = newInstance;

  // Unused Hooks Cleanup
  cleanupUnusedHooks();

  // commit mutations
  commitMutations(runtimeContext.workQueue.domMutations);

  // flush passive effects
  enqueue(() => {
    flushPassiveEffects(runtimeContext.workQueue.passiveEffects, runtimeContext.workQueue.cleanups);
  });
};

export const enqueueRender = withEnqueue(render);
