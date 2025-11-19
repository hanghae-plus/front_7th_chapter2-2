import { addEvent, removeEvent } from "./eventManager";
import { createElement } from "./createElement.js";

function updateAttributes(target, originNewProps, originOldProps) {
  const newProps = originNewProps || {};
  const oldProps = originOldProps || {};

  // 이전 속성 제거
  Object.keys(oldProps).forEach((key) => {
    if (!(key in newProps)) {
      // 새 props에 없는 속성은 제거
      if (key.startsWith("on")) {
        // 이벤트 리스너 제거
        const eventType = key.slice(2).toLowerCase();
        removeEvent(target, eventType, oldProps[key]);
      } else if (key === "className") {
        target.removeAttribute("class");
      } else if (typeof oldProps[key] === "boolean") {
        // boolean 속성 제거
        target[key] = false;
        // disabled만 DOM attribute도 제거
        if (key === "disabled") {
          target.removeAttribute(key);
        }
      } else {
        target.removeAttribute(key);
      }
    }
  });

  // 새 속성 추가 또는 업데이트
  Object.keys(newProps).forEach((key) => {
    const newValue = newProps[key];
    const oldValue = oldProps[key];

    if (newValue !== oldValue) {
      if (key.startsWith("on")) {
        // 이벤트 리스너
        const eventType = key.slice(2).toLowerCase();
        if (oldValue) {
          removeEvent(target, eventType, oldValue);
        }
        if (newValue) {
          addEvent(target, eventType, newValue);
        }
      } else if (key === "className") {
        if (newValue) {
          target.setAttribute("class", newValue);
        } else {
          target.removeAttribute("class");
        }
      } else if (typeof newValue === "boolean") {
        // boolean 속성 처리 (checked, disabled, selected 등)
        target[key] = newValue;

        // disabled만 DOM attribute로도 관리
        if (key === "disabled") {
          if (newValue) {
            target.setAttribute(key, "");
          } else {
            target.removeAttribute(key);
          }
        }
      } else if (newValue != null) {
        target.setAttribute(key, newValue);
      } else {
        target.removeAttribute(key);
      }
    }
  });
}

export function updateElement(parentElement, newNode, oldNode, index = 0) {
  // 1. oldNode가 있고 newNode가 없으면 제거
  if (!newNode && oldNode) {
    const childToRemove = parentElement.childNodes[index];
    if (childToRemove) {
      return parentElement.removeChild(childToRemove);
    }
    return;
  }

  // 2. oldNode가 없고 newNode가 있으면 추가
  if (newNode && !oldNode) {
    const newElement = createElement(newNode);
    if (newElement) {
      return parentElement.appendChild(newElement);
    }
    return;
  }

  // 3. 둘 다 텍스트 노드인 경우
  if (
    (typeof newNode === "string" || typeof newNode === "number") &&
    (typeof oldNode === "string" || typeof oldNode === "number")
  ) {
    const newText = String(newNode);
    const oldText = String(oldNode);
    if (newText !== oldText) {
      const childToUpdate = parentElement.childNodes[index];
      if (childToUpdate && childToUpdate.nodeType === Node.TEXT_NODE) {
        childToUpdate.textContent = newText;
      } else if (childToUpdate) {
        const newTextNode = createElement(newNode);
        if (newTextNode) {
          parentElement.replaceChild(newTextNode, childToUpdate);
        }
      }
    }
    return;
  }

  // 4. 타입이 다르면 교체
  const isNewNodePrimitive =
    typeof newNode === "string" || typeof newNode === "number";
  const isOldNodePrimitive =
    typeof oldNode === "string" || typeof oldNode === "number";

  if (
    isNewNodePrimitive ||
    isOldNodePrimitive ||
    newNode.type !== oldNode.type
  ) {
    const childToReplace = parentElement.childNodes[index];
    if (childToReplace) {
      const newElement = createElement(newNode);
      if (newElement) {
        return parentElement.replaceChild(newElement, childToReplace);
      }
    }
    return;
  }

  // 5. 같은 타입이면 속성과 자식만 업데이트
  const targetElement = parentElement.childNodes[index];
  if (targetElement && targetElement.nodeType === Node.ELEMENT_NODE) {
    updateAttributes(targetElement, newNode.props, oldNode.props);

    // 6. 자식 노드 재귀적 업데이트
    const newChildren = newNode.children || [];
    const oldChildren = oldNode.children || [];

    // 공통 부분 업데이트
    const minLength = Math.min(newChildren.length, oldChildren.length);
    for (let i = 0; i < minLength; i++) {
      updateElement(targetElement, newChildren[i], oldChildren[i], i);
    }

    // 새로운 자식 추가
    for (let i = minLength; i < newChildren.length; i++) {
      const newElement = createElement(newChildren[i]);
      if (newElement) {
        targetElement.appendChild(newElement);
      }
    }

    // 초과하는 oldChildren 제거 (역순으로)
    for (let i = oldChildren.length - 1; i >= newChildren.length; i--) {
      const childToRemove = targetElement.childNodes[i];
      if (childToRemove) {
        targetElement.removeChild(childToRemove);
      }
    }
  }
}
