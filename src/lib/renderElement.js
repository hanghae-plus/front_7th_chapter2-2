import { setupEventListeners } from './eventManager';
import { createElement } from './createElement';
import { normalizeVNode } from './normalizeVNode';
import { updateElement } from './updateElement';

export function renderElement(vNode, container) {
  const normalizedVNode = normalizeVNode(vNode);

  // 첫 렌더링인지 확인
  if (!container.firstChild) {
    // 첫 렌더링: 새 요소 생성
    const element = createElement(normalizedVNode);
    container.appendChild(element);
    setupEventListeners(container);
  } else {
    // 업데이트: 기존 DOM을 새 VNode로 업데이트
    updateElement(container.firstChild, normalizedVNode, container.__lastVNode);
  }

  // 다음 업데이트를 위해 VNode 저장
  container.__lastVNode = normalizedVNode;

  return container.firstChild;
}
