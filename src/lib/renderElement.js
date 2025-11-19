import { setupEventListeners } from "./eventManager";
import { createElement } from "./createElement";
import { normalizeVNode } from "./normalizeVNode";
import { updateElement } from "./updateElement";

/**
 * VNode를 container에 렌더링
 * 최초 렌더링시에는 createElement로 DOM을 생성하고
 * 이후에는 updateElement로 기존 DOM을 업데이트한다.
 * 렌더링이 완료되면 container에 이벤트를 등록한다.
 * @param {VNode} vNode - 렌더링할 VNode
 * @param {HTMLElement} container - 렌더링할 컨테이너
 */
export function renderElement(vNode, container) {
  // Step 1: VNode 정규화 (함수형 컴포넌트 실행, falsy 값 필터링)
  const normalizedVNode = normalizeVNode(vNode);

  // Step 2: 현재 container의 첫 번째 자식 노드 (기존 DOM)
  const existingChild = container.firstChild;

  if (!existingChild) {
    // Step 3-1: 최초 렌더링 - 새로운 DOM 생성
    const newElement = createElement(normalizedVNode);
    container.appendChild(newElement);
  } else {
    // Step 3-2: 업데이트 렌더링 - 기존 DOM 업데이트
    updateElement(container, normalizedVNode, container._vNode, 0);
  }

  // Step 4: VNode를 container에 저장 (다음 업데이트시 비교용)
  container._vNode = normalizedVNode;

  // Step 5: 이벤트 핸들러 설정
  setupEventListeners(container);
}
