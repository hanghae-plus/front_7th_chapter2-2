import { setupEventListeners } from "./eventManager";
import { createElement } from "./createElement";
import { normalizeVNode } from "./normalizeVNode";
// import { updateElement } from "./updateElement";

export function renderElement(vNode, container) {
  // 1. vNode를 정규화
  const normalized = normalizeVNode(vNode);

  // 2. container를 비우고 새로운 DOM 생성
  container.innerHTML = "";

  // 3. createElement로 노드를 만들고
  const element = createElement(normalized);

  // 4. container에 삽입
  container.appendChild(element);

  // 5. 이벤트를 등록
  setupEventListeners(container);
}
