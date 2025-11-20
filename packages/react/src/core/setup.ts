import { context } from "./context";
import { VNode } from "./types";
import { removeInstance } from "./dom";
import { cleanupUnusedHooks } from "./hooks";
import { render, enqueueRender } from "./render";

/**
 * Mini-React 애플리케이션의 루트를 설정하고 첫 렌더링을 시작합니다.
 *
 * @param rootNode - 렌더링할 최상위 VNode
 * @param container - VNode가 렌더링될 DOM 컨테이너
 */
export const setup = (rootNode: VNode | null, container: HTMLElement): void => {
  // 1. 컨테이너 유효성을 검사합니다
  if (!container) {
    throw new Error("Container element is required");
  }

  // 2. rootNode가 null이면 렌더링할 수 없습니다
  if (rootNode === null) {
    throw new Error("Root element cannot be null");
  }

  // 3. 이전 렌더링 내용을 정리합니다
  // 이전 인스턴스가 있으면 DOM에서 제거하고 이펙트 클린업을 실행합니다
  if (context.root.instance) {
    removeInstance(context.root.instance);
  }

  // 컨테이너의 모든 자식 노드를 제거합니다
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  // 4. 루트 컨텍스트를 리셋합니다
  context.root.reset({ container, node: rootNode });

  // 5. 훅 컨텍스트를 초기화합니다
  context.hooks.clear();

  // 6. 렌더링 스케줄러를 설정합니다 (순환 import 방지)
  context.scheduleRender = enqueueRender;

  // 7. 미사용 훅을 정리합니다 (초기 렌더링이므로 모든 기존 훅 정리)
  cleanupUnusedHooks();

  // 8. 첫 렌더링을 실행합니다
  render();
};
