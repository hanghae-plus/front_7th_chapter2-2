import { context } from "./context";
import { removeInstance } from "./dom";
import { cleanupUnusedHooks } from "./hooks";
import { render } from "./render";
import { VNode } from "./types";

/**
 * Mini-React 애플리케이션의 루트를 설정하고 첫 렌더링을 시작합니다.
 *
 * @param rootNode - 렌더링할 최상위 VNode
 * @param container - VNode가 렌더링될 DOM 컨테이너
 */
export const setup = (rootNode: VNode | null, container: HTMLElement): void => {
  // 1. 컨테이너 유효성을 검사합니다.
  if (!container || !(container instanceof HTMLElement)) throw new Error("Container is required");

  // null 루트 엘리먼트는 렌더할 수 없습니다.
  if (rootNode === null) throw new Error("Cannot render null root element");

  // 2. 이전 렌더링 내용을 정리하고 컨테이너를 비웁니다.
  const previousInstance = context.root.instance;
  if (previousInstance) removeInstance(container, previousInstance);
  container.textContent = "";

  // 3. 루트 컨텍스트와 훅 컨텍스트를 리셋합니다.
  cleanupUnusedHooks();
  context.root.reset({ container, node: rootNode });
  context.hooks.clear();
  context.effects.queue.length = 0;

  // 4. 첫 렌더링을 실행합니다.
  render();
};
