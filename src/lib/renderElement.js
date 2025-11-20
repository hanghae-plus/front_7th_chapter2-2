import { setupEventListeners, migrateRootToContainer } from "./eventManager";
import { createElement } from "./createElement";
import { normalizeVNode } from "./normalizeVNode";
import { updateElement } from "./updateElement";

// 각 container에 대한 이전 vNode를 추적
const containerVNodes = new WeakMap();

export function renderElement(vNode, container) {
  // 최초 렌더링시에는 createElement로 DOM을 생성하고
  // 이후에는 updateElement로 기존 DOM을 업데이트한다.
  // 렌더링이 완료되면 container에 이벤트를 등록한다.

  if (!container) return;

  // vNode 정규화 (컴포넌트 실행)
  const normalizedVNode = normalizeVNode(vNode);

  // 이전 vNode 가져오기
  const oldVNode = containerVNodes.get(container);

  if (!oldVNode) {
    // 최초 렌더링: createElement로 DOM 생성
    const element = createElement(normalizedVNode);

    // container 비우기
    container.innerHTML = "";

    // DOM 추가
    if (element) {
      if (element instanceof DocumentFragment) {
        container.appendChild(element);
      } else {
        container.appendChild(element);
      }
    }
  } else {
    // 업데이트: updateElement로 DOM 업데이트
    updateElement(container, normalizedVNode, oldVNode, 0);
  }

  // 이전 vNode 저장
  containerVNodes.set(container, normalizedVNode);

  // container의 모든 자식 요소에 대해 container를 root로 설정
  migrateRootToContainer(container);

  // 이벤트 리스너 설정
  // container를 root로 사용하도록 설정
  setupEventListeners(container);
}
