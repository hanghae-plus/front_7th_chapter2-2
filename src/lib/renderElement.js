// src/lib/renderElement.js
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
  const existingNode = container.firstChild;
  const previousVNode = previousVNodes.get(container);

  if (!existingNode || !previousVNode) {
    // 최초 렌더링시에는 createElement로 DOM을 생성하고
    // 기존 내용이 있으면 제거
    container.innerHTML = "";

    const element = createElement(normalizedVNode);
    container.appendChild(element);

    // 이전 vNode 저장
    previousVNodes.set(container, normalizedVNode);
  } else {
    // 이후에는 updateElement로 기존 DOM을 업데이트한다.
    updateElement(container, normalizedVNode, previousVNode, 0);

    // 이전 vNode 업데이트
    previousVNodes.set(container, normalizedVNode);
  }

  // 렌더링이 완료되면 container에 이벤트를 등록한다.
  setupEventListeners(container);
}
