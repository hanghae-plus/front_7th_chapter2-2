import { setupEventListeners } from "./eventManager";
import { createElement } from "./createElement";
import { normalizeVNode } from "./normalizeVNode";
import { updateElement } from "./updateElement";

export function renderElement(vNode, container) {
  const normalized = normalizeVNode(vNode);
  if (!container._vNode) {
    // 최초 렌더링시에는 createElement로 DOM을 생성하고
    const element = createElement(normalized);
    container.appendChild(element);
  } else {
    // 이후에는 updateElement로 기존 DOM을 업데이트한다.
    updateElement(container, normalized, container._vNode); // container._vNode는 항상 존재하게 되지 않나?
  }

  container._vNode = normalized; // 이전 vNode 저장

  // 렌더링이 완료되면 container에 이벤트를 등록한다.
  setupEventListeners(container);
}
