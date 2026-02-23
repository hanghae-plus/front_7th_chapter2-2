import { context } from "./context";
import { VNode } from "./types";
import { removeInstance } from "./dom";
import { cleanupUnusedHooks } from "./hooks";
import { render } from "./render";

/**
 * Mini-React 애플리케이션의 루트를 설정하고 첫 렌더링을 시작합니다.
 *
 * @param rootNode - 렌더링할 최상위 VNode
 * @param container - VNode가 렌더링될 DOM 컨테이너
 */
export const setup = (rootNode: VNode | null, container: HTMLElement): void => {
  if (!(container instanceof HTMLElement)) {
    throw new Error("유효한 container가 필요합니다.");
  }

  if (!rootNode) {
    throw new Error("렌더링할 요소가 필요합니다.");
  }

  const { root } = context;

  if (root.instance && root.container) {
    removeInstance(root.container, root.instance);
  }

  context.hooks.visited.clear();
  cleanupUnusedHooks();
  context.hooks.clear();
  context.effects.queue = [];

  container.innerHTML = "";
  root.reset({ container, node: rootNode });

  render();
};
