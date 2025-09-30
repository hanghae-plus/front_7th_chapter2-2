import { context } from "./context";
import { VNode } from "./types";
import { removeInstance } from "./dom";
import { cleanupUnusedHooks } from "./hooks";
import { render } from "./render";

const resetContext = (container: HTMLElement, node: VNode): void => {
  cleanupUnusedHooks();
  context.hooks.clear();
  context.effects.queue.length = 0;
  context.root.reset({ container, node });
};

export const setup = (rootNode: VNode | null, container: HTMLElement): void => {
  if (!container) {
    throw new Error("MiniReact.render requires a target container.");
  }
  if (rootNode === null) {
    throw new Error("MiniReact cannot render null as the root element.");
  }
  removeInstance(context.root.container as HTMLElement, context.root.instance);
  container.replaceChildren();
  resetContext(container, rootNode);
  render();
};
