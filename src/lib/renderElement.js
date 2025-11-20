import { setupEventListeners } from "./eventManager";
import { createElement } from "./createElement";
import { normalizeVNode } from "./normalizeVNode";
import { updateElement } from "./updateElement";

export function renderElement(vNode, container) {
  if (!container) {
    throw new Error("Container element is required for rendering.");
  }

  const normalizedVNode = normalizeVNode(vNode);

  if (container.__currentVNode) {
    updateElement(container, normalizedVNode, container.__currentVNode);
  } else {
    const dom = createElement(normalizedVNode);
    container.innerHTML = "";
    if (dom) {
      container.appendChild(dom);
    }
  }

  container.__currentVNode = normalizedVNode;
  setupEventListeners(container);
}
