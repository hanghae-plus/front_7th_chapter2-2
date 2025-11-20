import { addEvent, removeEvent } from "./eventManager";
import { createElement } from "./createElement.js";

// boolean DOM 프로퍼티로 다루는 속성들
const BOOLEAN_PROPS = new Set(["checked", "disabled", "selected", "readOnly"]);

function isTextValue(node) {
  return typeof node === "string" || typeof node === "number";
}

function isSkippablePropKey(key) {
  return key === "children" || key === "key";
}

function updateAttributes(target, newProps = {}, oldProps = {}) {
  // 1. 이전/새 props 의 key 를 모두 합쳐서 한 번에 처리
  const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);

  allKeys.forEach((key) => {
    if (isSkippablePropKey(key)) return;

    const prev = oldProps[key];
    const next = newProps[key];

    // 값이 완전히 같으면 아무 것도 하지 않음
    if (prev === next) {
      return;
    }

    // 이벤트 핸들러 (onClick, onChange 등)
    if (key.startsWith("on")) {
      const eventType = key.slice(2).toLowerCase();
      // 이전 핸들러 제거
      if (typeof prev === "function") {
        removeEvent(target, eventType, prev);
      }
      // 새 핸들러 추가
      if (typeof next === "function") {
        addEvent(target, eventType, next);
      }
      return;
    }

    // className ↔ class
    if (key === "className") {
      if (next == null || next === "") {
        target.removeAttribute("class");
      } else {
        target.setAttribute("class", next);
      }
      return;
    }

    // boolean 프로퍼티들 (checked, disabled, selected, readOnly)
    if (BOOLEAN_PROPS.has(key)) {
      // newProps 에 없거나 falsy 면 false 로, 그렇지 않으면 true/값 그대로
      target[key] = !!next;
      return;
    }

    // 그 외 일반 속성
    if (next == null) {
      // null / undefined → 속성 제거
      target.removeAttribute(key);
    } else {
      target.setAttribute(key, next);
    }
  });
}

export function updateElement(parentElement, newNode, oldNode, index = 0) {
  // 1. 노드 삭제: oldNode는 있는데 newNode가 없음
  if (!newNode && oldNode) {
    return parentElement.removeChild(parentElement.childNodes[index]);
  }

  // 2. 노드 추가: newNode는 있는데 oldNode가 없음
  if (newNode && !oldNode) {
    return parentElement.appendChild(createElement(newNode));
  }

  // 3. 텍스트 노드 변경: 둘 다 문자열/숫자
  const newIsText = isTextValue(newNode);
  const oldIsText = isTextValue(oldNode);

  if (newIsText && oldIsText) {
    if (newNode !== oldNode) {
      // 텍스트 내용이 다르면 변경
      parentElement.childNodes[index].textContent = newNode;
    }
    return;
  }

  // 4. 타입 변경: div → span 등 (전체 교체)
  if (newNode.type !== oldNode.type) {
    return parentElement.replaceChild(
      createElement(newNode),
      parentElement.childNodes[index],
    );
  }

  // 5. 같은 타입: 속성 업데이트 + children 재귀
  const element = parentElement.childNodes[index];

  // 속성 업데이트
  updateAttributes(element, newNode.props || {}, oldNode.props || {});

  // Children 재귀적으로 업데이트
  const newChildren = newNode.children || [];
  const oldChildren = oldNode.children || [];

  // 공통 children 업데이트
  const minLength = Math.min(newChildren.length, oldChildren.length);
  for (let i = 0; i < minLength; i++) {
    updateElement(element, newChildren[i], oldChildren[i], i);
  }

  // 새로운 children 추가
  if (newChildren.length > oldChildren.length) {
    for (let i = minLength; i < newChildren.length; i++) {
      element.appendChild(createElement(newChildren[i]));
    }
  }

  // 남은 children 제거 (역순으로!)
  if (oldChildren.length > newChildren.length) {
    for (let i = oldChildren.length - 1; i >= newChildren.length; i--) {
      element.removeChild(element.childNodes[i]);
    }
  }
}
