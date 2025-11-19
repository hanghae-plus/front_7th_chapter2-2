import { addEvent, removeEvent } from "./eventManager";
import { createElement } from "./createElement.js";

function updateAttributes(target, originNewProps, originOldProps) {
  const newProps = originNewProps || {};
  const oldProps = originOldProps || {};

  // 이전 속성 제거 또는 업데이트
  Object.keys(oldProps).forEach((key) => {
    if (!(key in newProps)) {
      // 새 props에 없는 속성은 제거
      if (key.startsWith("on")) {
        // 이벤트 리스너 제거
        const eventType = key.slice(2).toLowerCase();
        removeEvent(target, eventType, oldProps[key]);
      } else if (key === "className") {
        target.removeAttribute("class");
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
        addEvent(target, eventType, newValue);
      } else if (key === "className") {
        target.setAttribute("class", newValue);
      } else if (typeof newValue === "boolean") {
        // 불리언 속성 (checked, disabled, selected 등)
        // property로만 설정하고 attribute는 설정하지 않음
        target[key] = newValue;
        if (!newValue) {
          target.removeAttribute(key);
        }
      } else {
        target.setAttribute(key, newValue);
      }
    }
  });
}

export function updateElement(parentElement, newNode, oldNode, index = 0) {
  // 1. oldNode가 있고 newNode가 없으면 제거
  if (!newNode && oldNode) {
    return parentElement.removeChild(parentElement.childNodes[index]);
  }

  // 2. oldNode가 없고 newNode가 있으면 추가
  if (newNode && !oldNode) {
    return parentElement.appendChild(createElement(newNode));
  }

  // 3. 둘 다 텍스트 노드인 경우
  if (typeof newNode === "string" && typeof oldNode === "string") {
    if (newNode !== oldNode) {
      return parentElement.replaceChild(
        createElement(newNode),
        parentElement.childNodes[index],
      );
    }
    return;
  }

  // 4. 타입이 다르면 교체
  if (typeof newNode === "string" || typeof oldNode === "string") {
    return parentElement.replaceChild(
      createElement(newNode),
      parentElement.childNodes[index],
    );
  }

  if (newNode.type !== oldNode.type) {
    return parentElement.replaceChild(
      createElement(newNode),
      parentElement.childNodes[index],
    );
  }

  // 5. 같은 타입이면 속성만 업데이트
  const targetElement = parentElement.childNodes[index];
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
    targetElement.appendChild(createElement(newChildren[i]));
  }

  // 초과하는 oldChildren 제거 (역순으로)
  for (let i = oldChildren.length - 1; i >= newChildren.length; i--) {
    if (targetElement.childNodes[i]) {
      targetElement.removeChild(targetElement.childNodes[i]);
    }
  }
}
