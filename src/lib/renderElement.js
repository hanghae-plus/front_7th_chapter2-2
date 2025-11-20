import { setupEventListeners } from "./eventManager";
import { createElement } from "./createElement";
import { normalizeVNode } from "./normalizeVNode";
import { updateElement } from "./updateElement";

export function renderElement(vNode, container) {
  // 최초 렌더링시에는 createElement로 DOM을 생성하고
  // 이후에는 updateElement로 기존 DOM을 업데이트한다.
  // 렌더링이 완료되면 container에 이벤트를 등록한다.
  const el = normalizeVNode(vNode);

  if (!container._vNode) {
    // 최초 렌더
    const newEl = createElement(el);
    container.replaceChildren(newEl);
  } else {
    // 이후 렌더
    const nextChildren = Array.isArray(el) ? el : [el];
    // 이전 노드 상태를 _vNode 속성에 저장
    const prevChildren = Array.isArray(container._vNode)
      ? container._vNode
      : container._vNode
        ? [container._vNode]
        : [];

    const sharedLength = Math.min(nextChildren.length, prevChildren.length);
    for (let i = 0; i < sharedLength; i += 1) {
      updateElement(container, nextChildren[i], prevChildren[i], i);
    }

    if (nextChildren.length > prevChildren.length) {
      for (let i = sharedLength; i < nextChildren.length; i += 1) {
        updateElement(container, nextChildren[i], undefined, i);
      }
    } else if (prevChildren.length > nextChildren.length) {
      for (let i = prevChildren.length - 1; i >= sharedLength; i -= 1) {
        updateElement(container, undefined, prevChildren[i], i);
      }
    }
  }
  container._vNode = el;
  setupEventListeners(container);
}
