import { setupEventListeners } from "./eventManager";
import { createElement } from "./createElement";
import { normalizeVNode } from "./normalizeVNode";
import { updateElement } from "./updateElement";

export function renderElement(vNode, container) {
  // vNode 정규화
  const normalized = normalizeVNode(vNode);

  // 최초 렌더링
  if (!container.firstChild) {
    const $el = createElement(normalized);
    container.appendChild($el);
    setupEventListeners(container);
  } else {
    // 업데이트
    updateElement(container, normalized, container._vNode);
  }

  // 현재 vNode 저장
  container._vNode = normalized;
}
