import { addEvent } from "./eventManager";
// import { normalizeVNode } from "./normalizeVNode";

export function createElement(vNode) {
  // 1. vNode가 null, undefined, boolean일 경우 빈 텍스트 노드 반환
  if (vNode === null || vNode === undefined || typeof vNode === "boolean") {
    return document.createTextNode("");
  }

  // 2. vNode가 문자열이나 숫자면 텍스트 노드 생성
  if (typeof vNode === "string" || typeof vNode === "number") {
    return document.createTextNode(vNode);
  }

  // 함수형 컴포넌트는 정규화(normalize) 과정을 거쳐야 함
  if (typeof vNode.type === "function") {
    throw new Error(
      "Cannot create element from a component. Normalize it first.",
    );
  }

  // 3. vNode가 배열이면 DocumentFragment 생성
  if (Array.isArray(vNode)) {
    const fragment = document.createDocumentFragment();
    vNode.forEach((child) => fragment.appendChild(createElement(child)));
    return fragment;
  }

  // 4. 실제 DOM 요소 생성
  const $el = document.createElement(vNode.type);

  // 속성 적용
  updateAttributes($el, vNode.props);

  // 자식 요소 재귀적으로 생성 및 추가
  vNode.children
    .map(createElement) // 각 자식 vNode에 대해 DOM 요소 생성
    .forEach((childElement) => {
      $el.appendChild(childElement);
    });

  return $el;
}

function updateAttributes($el, props) {
  if (!props) return;

  for (const key in props) {
    const value = props[key];

    // 이벤트 핸들러 처리 (e.g., onClick)
    if (key.startsWith("on")) {
      const eventName = key.slice(2).toLowerCase();
      addEvent($el, eventName, value);
    }
    // className 처리
    else if (key === "className") {
      $el.className = value;
    }
    // boolean 속성 처리 (e.g., disabled, checked)
    else if (typeof value === "boolean") {
      if (value) {
        $el.setAttribute(key, "");
      }
    }
    // 기타 모든 속성
    else {
      $el.setAttribute(key, value);
    }
  }
}
