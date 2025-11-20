import { setupEventListeners } from "./eventManager";
import { createElement } from "./createElement";
import { normalizeVNode } from "./normalizeVNode";
import { updateElement } from "./updateElement";

export function renderElement(vNode, container) {
  // normalizeVNode를 해서
  // 함수 컴포넌트 → 실제 HTML 요소로 변환
  // null/undefined → ""로 변환
  const normalizedVNode = normalizeVNode(vNode);
  const oldVNode = container._vNode;

  // 최초 렌더링시에는 createElement로 DOM을 생성하고
  if (!oldVNode) {
    // 최초 렌더링
    container.appendChild(createElement(normalizedVNode));
    // 최초 렌더링 시에만 이벤트 등록!
    setupEventListeners(container);
  } else {
    // 재렌더링
    updateElement(container, normalizedVNode, oldVNode);
    // 재렌더링 시에는 이벤트 등록 안 함!
  }

  // 다음 렌더링 때 비교 하기 위해 저장
  container._vNode = normalizedVNode;
}
