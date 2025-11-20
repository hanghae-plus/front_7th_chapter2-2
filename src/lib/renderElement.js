import { setupEventListeners } from "./eventManager";
import { createElement } from "./createElement";
import { normalizeVNode } from "./normalizeVNode";
import { updateElement } from "./updateElement";

// 이전 vNode를 저장하는 WeakMap
const oldVNodeMap = new WeakMap();

export function renderElement(vNode, container) {
  // 1. vNode를 정규화
  const normalized = normalizeVNode(vNode);

  // 2. 이전 vNode 가져오기
  const oldVNode = oldVNodeMap.get(container);

  // 3. 최초 렌더링인지 확인
  if (!oldVNode) {
    // 최초 렌더링: createElement 사용
    container.innerHTML = "";
    const element = createElement(normalized);
    container.appendChild(element);
  } else {
    // 리렌더링: updateElement 사용
    updateElement(container, normalized, oldVNode, 0);
  }

  // 4. 현재 vNode 저장
  oldVNodeMap.set(container, normalized);

  // 5. 이벤트를 등록
  setupEventListeners(container);
}
