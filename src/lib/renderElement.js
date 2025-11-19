import { setupEventListeners } from "./eventManager";
import { createElement } from "./createElement";
import { normalizeVNode } from "./normalizeVNode";
import { updateElement } from "./updateElement";

// container별로 이전 vNode를 저장 (updateElement에서 비교하기 위해)
const previousVNodes = new WeakMap();

export function renderElement(vNode, container) {
  // vNode 정규화
  const normalizedVNode = normalizeVNode(vNode);

  // container에 이미 DOM이 있는지 확인 (최초 렌더링인지 판단)
  const previousVNode = previousVNodes.get(container);
  if (!previousVNode) {
    container.innerHTML = "";
    const element = createElement(normalizedVNode);
    container.appendChild(element);
  } else {
    // 이후에는 updateElement로 기존 DOM을 업데이트한다.
    updateElement(container, normalizedVNode, previousVNode, 0);
  }
  // 다음 렌더링을 위해 현재 vNode 저장
  previousVNodes.set(container, normalizedVNode);

  // 이벤트 위임을 위한 이벤트 리스너 설정
  setupEventListeners(container);
}
