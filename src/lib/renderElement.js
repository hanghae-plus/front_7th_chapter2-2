import { setupEventListeners } from "./eventManager";
import { createElement } from "./createElement";
import { normalizeVNode } from "./normalizeVNode";
import { updateElement } from "./updateElement";

// 컨테이너별로 이전 vNode를 저장 (업데이트를 위해)
const containerVNodes = new WeakMap();

export function renderElement(vNode, container) {
  // vNode 정규화 (함수 컴포넌트 실행)
  const normalizedVNode = normalizeVNode(vNode);

  // 이전 vNode 가져오기
  const oldVNode = containerVNodes.get(container);

  if (oldVNode) {
    // 업데이트 모드: 기존 DOM을 업데이트
    updateElement(container, normalizedVNode, oldVNode, 0);
  } else {
    // 초기 렌더링: DOM 생성 및 추가
    // 컨테이너 비우기
    container.innerHTML = "";

    // DOM 생성
    const domElement = createElement(normalizedVNode);

    // DocumentFragment인 경우 자식 노드들을 추가
    if (domElement.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      while (domElement.firstChild) {
        container.appendChild(domElement.firstChild);
      }
    } else {
      container.appendChild(domElement);
    }
  }

  // 이벤트 위임 설정 (한 번만 설정)
  setupEventListeners(container);

  // 현재 vNode 저장 (다음 업데이트를 위해)
  containerVNodes.set(container, normalizedVNode);
}
