import { addEvent, removeEvent } from "./eventManager";
import { createElement } from "./createElement.js";

/**
 * DOM 요소의 속성(attributes)을 업데이트하는 함수
 * @param {HTMLElement} target - 업데이트할 DOM 요소
 * @param {Object} originNewProps - 새로운 props
 * @param {Object} originOldProps - 이전 props
 */

function updateAttributes(target, originNewProps, originOldProps) {
  const newProps = originNewProps || {};
  const oldProps = originOldProps || {};

  // 1단계: 이전 props에 있지만 새 props에 없는 속성 제거
  for (const key in oldProps) {
    if (!(key in newProps)) {
      if (key.startsWith("on")) {
        // 이벤트 핸들러 제거
        const eventType = key.slice(2).toLowerCase();
        removeEvent(target, eventType, oldProps[key]);
      } else if (key === "className") {
        // className은 class 속성으로 변환
        target.removeAttribute("class");
      } else if (key === "checked" || key === "selected") {
        target[key] = false;
        // boolean 속성은 property로 직접 설정
      } else if (typeof oldProps[key] === "boolean") {
        target[key] = false;
        target.removeAttribute(key);
      } else {
        // 일반 속성 제거
        target.removeAttribute(key);
      }
    }
  }

  // 2단계: 새 props에 있는 속성 추가/업데이트
  for (const key in newProps) {
    // 값이 변경된 경우만 업데이트
    if (oldProps[key] !== newProps[key]) {
      if (key.startsWith("on")) {
        // 이벤트 핸들러 업데이트
        const eventType = key.slice(2).toLowerCase();
        if (oldProps[key]) {
          // 이벤트 핸들러 제거
          removeEvent(target, eventType, oldProps[key]);
        }
        // 이벤트 핸들러 추가
        addEvent(target, eventType, newProps[key]);
      } else if (key === "className") {
        // className 속성 추가
        target.setAttribute("class", newProps[key]);
      } else if (key === "checked" || key === "selected") {
        // boolean 속성 직접 설정
        target[key] = newProps[key];
      } else if (typeof newProps[key] === "boolean") {
        target[key] = newProps[key];
        if (newProps[key]) {
          target.setAttribute(key, "");
        } else {
          target.removeAttribute(key);
        }
      } else {
        // 일반 속성 추가/업데이트
        target.setAttribute(key, newProps[key]);
      }
    }
  }
}

/**
 * Virtual DOM의 diff 알고리즘을 구현한 함수
 * 이전 vNode와 새 vNode를 비교해서 DOM을 효율적으로 업데이트
 * @param {HTMLElement} parentElement - 부모 DOM 요소
 * @param {Object|string|number} newNode - 새로운 vNode
 * @param {Object|string|number} oldNode - 이전 vNode
 * @param {number} index - 부모 요소 내에서의 인덱스
 */

export function updateElement(parentElement, newNode, oldNode, index = 0) {
  // 케이스 1: 새 노드가 없고 이전 노드만 있는 경우 → 제거
  if (!newNode && oldNode) {
    const nodeToRemove = parentElement.childNodes[index];
    if (nodeToRemove) {
      parentElement.removeChild(nodeToRemove);
    }
    return;
  }

  // 케이스 2: 새 노드는 있고 이전 노드가 없는 경우 → 추가
  if (newNode && !oldNode) {
    parentElement.appendChild(createElement(newNode));
    return;
  }

  // 케이스 3: 둘 다 텍스트 노드인 경우 → 텍스트만 교체
  if (
    typeof newNode === "string" ||
    typeof newNode === "number" ||
    typeof oldNode === "string" ||
    typeof oldNode === "number"
  ) {
    if (newNode !== oldNode) {
      parentElement.replaceChild(
        createElement(newNode),
        parentElement.childNodes[index],
      );
    }
    return;
  }

  // 케이스 4: 노드 타입이 다른 경우 → 전체 교체
  if (newNode.type !== oldNode.type) {
    parentElement.replaceChild(
      createElement(newNode),
      parentElement.childNodes[index],
    );
    return;
  }

  // 케이스 5: 같은 타입의 노드 → 속성과 자식만 업데이트
  const currentElement = parentElement.childNodes[index];
  // 속성 업데이트
  updateAttributes(currentElement, newNode.props, oldNode.props);
  // 자식 노드들 처리
  const newChildren = newNode.children || [];
  const oldChildren = oldNode.children || [];

  // 자식이 줄어든 경우: 뒤에서부터 제거 (인덱스 문제 방지)
  if (oldChildren.length > newChildren.length) {
    for (let i = oldChildren.length - 1; i >= newChildren.length; i--) {
      const childToRemove = currentElement.childNodes[i];
      if (childToRemove) {
        currentElement.removeChild(childToRemove);
      }
    }
  }

  // 공통 길이만큼은 재귀적으로 업데이트
  const minLength = Math.min(newChildren.length, oldChildren.length);

  for (let i = 0; i < minLength; i++) {
    updateElement(currentElement, newChildren[i], oldChildren[i], i);
  }

  // 새로 추가된 자식들 추가
  for (let i = minLength; i < newChildren.length; i++) {
    updateElement(currentElement, newChildren[i], null, i);
  }
}
