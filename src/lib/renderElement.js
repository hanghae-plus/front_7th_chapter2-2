import { setupEventListeners } from './eventManager';
import { createElement } from './createElement';
import { normalizeVNode } from './normalizeVNode';
import { updateElement } from './updateElement';

// 컨테이너별로 이전 vNode 저장
const containerVNodeMap = new WeakMap();

export function renderElement(vNode, container) {
  const normalizedVNode = normalizeVNode(vNode);
  const oldVNode = containerVNodeMap.get(container);

  if (!oldVNode) {
    container.innerHTML = '';
    const element = createElement(normalizedVNode);
    container.appendChild(element);
  } else {
    updateElement(container, normalizedVNode, oldVNode, 0);
  }

  containerVNodeMap.set(container, normalizedVNode);

  setupEventListeners(container);
}
