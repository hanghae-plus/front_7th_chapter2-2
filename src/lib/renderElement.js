import { setupEventListeners } from "./eventManager";
import { createElement } from "./createElement";
import { normalizeVNode } from "./normalizeVNode";
import { updateElement } from "./updateElement";

// 이전 vNode를 저장하기 위한 WeakMap
const oldVNodeMap = new WeakMap();

export function renderElement(vNode, container) {
  // 1. vNode를 정규화
  const normalizedVNode = normalizeVNode(vNode);

  // 2. 이전 vNode 가져오기
  const oldVNode = oldVNodeMap.get(container);

  if (!oldVNode) {
    // 최초 렌더링: createElement로 DOM 생성
    container.innerHTML = "";
    container.appendChild(createElement(normalizedVNode));
  } else {
    // 리렌더링: updateElement로 diff 알고리즘 적용
    updateElement(container, normalizedVNode, oldVNode, 0);
  }

  // 3. 현재 vNode를 저장
  oldVNodeMap.set(container, normalizedVNode);

  // 4. 이벤트 위임 방식으로 이벤트 등록
  setupEventListeners(container);
}
