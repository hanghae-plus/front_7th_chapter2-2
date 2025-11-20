import { setupEventListeners, addEvent } from "./eventManager";
import { createElement } from "./createElement";
import { normalizeVNode } from "./normalizeVNode";
import { updateElement } from "./updateElement";

// 컨테이너별 이전 vNode를 저장하는 WeakMap
const containerVNodeMap = new WeakMap();

// 이벤트 핸들러 이름을 이벤트 타입으로 변환 (onClick -> click)
function getEventType(handlerName) {
  if (handlerName.startsWith("on")) {
    return handlerName.slice(2).toLowerCase();
  }
  return null;
}

// vNode 트리를 순회하면서 이벤트 핸들러를 등록
export function registerEventHandlers(normalizedVNode, domElement) {
  // props에서 이벤트 핸들러 찾기
  if (normalizedVNode.props) {
    Object.keys(normalizedVNode.props).forEach((key) => {
      const eventType = getEventType(key);
      if (eventType && typeof normalizedVNode.props[key] === "function") {
        addEvent(domElement, eventType, normalizedVNode.props[key]);
      }
    });
  }

  // 자식 요소들 처리
  if (normalizedVNode.children && Array.isArray(normalizedVNode.children)) {
    let childIndex = 0;
    normalizedVNode.children.forEach((child) => {
      if (typeof child === "string" || typeof child === "number") {
        // 텍스트 노드는 건너뛰기
        childIndex++;
        return;
      }

      if (child && typeof child === "object" && child.type) {
        // DOM 요소 찾기
        const childElement = domElement.childNodes[childIndex];
        if (childElement) {
          registerEventHandlers(child, childElement);
          // 다음 자식으로 이동 (텍스트 노드 제외)
          if (childElement.nodeType !== Node.TEXT_NODE) {
            childIndex++;
          }
        }
      }
    });
  }
}

export function renderElement(vNode, container) {
  // vNode 정규화
  const normalizedVNode = normalizeVNode(vNode);

  // 이전 vNode 가져오기
  const oldVNode = containerVNodeMap.get(container);

  // 이전 vNode가 없으면 초기 렌더링
  if (!oldVNode) {
    // 컨테이너 초기화
    container.innerHTML = "";

    // DOM 요소 생성
    const $el = createElement(normalizedVNode);

    // 컨테이너에 추가
    container.appendChild($el);

    // 이벤트 핸들러 등록
    registerEventHandlers(normalizedVNode, $el);

    // 이벤트 위임 설정
    setupEventListeners(container);

    // 현재 vNode 저장
    containerVNodeMap.set(container, normalizedVNode);
    return;
  }

  // diff 알고리즘: 이전 vNode와 새로운 vNode 비교
  // 컨테이너의 첫 번째 자식 요소 가져오기
  const existingElement = container.firstChild;

  // 기존 요소가 없으면 새로 생성
  if (!existingElement) {
    const $el = createElement(normalizedVNode);
    container.appendChild($el);
    registerEventHandlers(normalizedVNode, $el);
    setupEventListeners(container);
    containerVNodeMap.set(container, normalizedVNode);
    return;
  }

  // updateElement를 사용하여 업데이트
  updateElement(container, normalizedVNode, oldVNode, 0);

  // 이벤트 위임 설정
  setupEventListeners(container);

  // 현재 vNode 저장
  containerVNodeMap.set(container, normalizedVNode);
}
