import { storeContext } from "./context";
import { VNode } from "./types";
import { removeInstance } from "./dom";
import { render } from "./render";

export const setup = (rootNode: VNode | null, container: HTMLElement): void => {
  if (!container) throw new Error("Container is not found");
  if (!rootNode) throw new Error("Root node is not found");

  // clean up previous content
  removeInstance(container, storeContext.root.instance);

  // initialize storeContext
  storeContext.root.container = container;
  storeContext.root.node = rootNode;
  storeContext.root.instance = null;

  storeContext.hooks.clear();
  storeContext.cleanupEffects.clear();

  // first render
  render();
};
