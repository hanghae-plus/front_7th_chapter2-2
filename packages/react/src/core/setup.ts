import { context } from "./context";
import { VNode } from "./types";
import { render } from "./render";

/**
 * Mini-React 애플리케이션의 루트를 설정하고 첫 렌더링을 시작합니다.
 *
 * @param rootNode - 렌더링할 최상위 VNode
 * @param container - VNode가 렌더링될 DOM 컨테이너
 */
export const setup = (rootNode: VNode | null, container: HTMLElement): void => {
  // 1. 루트 노드 유효성을 검사합니다.
  if (!rootNode) {
    throw new Error("루트 노드가 제공되어야 합니다.");
  }

  // 2. 컨테이너 유효성을 검사합니다.
  if (!container) {
    throw new Error("컨테이너가 제공되어야 합니다.");
  }

  if (!(container instanceof HTMLElement)) {
    throw new Error("컨테이너는 HTMLElement여야 합니다.");
  }

  // 3. 루트 컨텍스트 업데이트 (instance는 유지!)
  const isFirstRender = !context.root.instance;
  const isNewContainer = context.root.container !== container;

  context.root.container = container;
  context.root.node = rootNode;

  // 4. 컨테이너 초기화 및 Hook 관리
  if (isFirstRender || isNewContainer) {
    // 첫 렌더링이거나 새로운 컨테이너면 비우기
    container.innerHTML = "";

    if (isFirstRender) {
      // 첫 렌더링: 모든 Hook 초기화
      context.hooks.clear();
    } else if (isNewContainer) {
      // 새 컨테이너: 이전 instance 초기화 (다른 컨테이너니까 처음부터)
      context.root.instance = null;
      context.hooks.clear();
    }
  } else {
    // 같은 컨테이너 재렌더링: visited만 초기화
    context.hooks.visited.clear();
  }

  // 5. 렌더링 실행 (reconcile이 알아서 mount/update 판단)
  render();
};
