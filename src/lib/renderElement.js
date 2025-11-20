import { setupEventListeners } from "./eventManager";
import { createElement } from "./createElement";
import { normalizeVNode } from "./normalizeVNode";
import { updateElement } from "./updateElement";

let prevNode = null;

export function renderElement(vNode, container) {
  // 최초 렌더링시에는 createElement로 DOM을 생성하고
  // container가 비어있는지 확인
  // vNode 정규화
  const node = normalizeVNode(vNode);
  if (!container.hasChildNodes()) {
    const element = createElement(node);
    container.appendChild(element);
  } else {
    // 이후에는 updateElement로 기존 DOM을 업데이트한다.
    updateElement(container, node, prevNode);
  }

  prevNode = node;

  // 렌더링이 완료되면 container에 이벤트를 등록한다.
  setupEventListeners(container);
}
