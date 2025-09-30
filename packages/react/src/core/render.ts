import { context } from "./context";
import { getDomNodes, insertInstance } from "./dom";
import { reconcile } from "./reconciler";
import { cleanupUnusedHooks } from "./hooks";
import { withEnqueue } from "../utils";

export const render = (): void => {
  if (!context.root.container || !context.root.node) {
    return;
  }

  context.hooks.visited = new Set();
  context.hooks.cursor.clear();

  context.root.instance = reconcile(context.root.container, context.root.instance, context.root.node, "0");
  if (context.root.instance) {
    const rootNodes = getDomNodes(context.root.instance);
    const needsInsertion = rootNodes.some((node) => node && node.parentNode !== context.root.container);
    if (needsInsertion) {
      insertInstance(context.root.container, context.root.instance);
    }
  }
  cleanupUnusedHooks();
};

export const enqueueRender = withEnqueue(render);
