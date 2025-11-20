import { addEvent, removeEvent } from "./eventManager";
import { createElement } from "./createElement.js";

// 이벤트 핸들러 이름을 이벤트 타입으로 변환 (onClick -> click)
function getEventType(handlerName) {
  if (handlerName.startsWith("on")) {
    return handlerName.slice(2).toLowerCase();
  }
  return null;
}

function updateAttributes(target, newProps, oldProps = {}) {
  const allKeys = new Set([
    ...Object.keys(newProps || {}),
    ...Object.keys(oldProps || {}),
  ]);

  allKeys.forEach((key) => {
    const newValue = newProps?.[key];
    const oldValue = oldProps?.[key];

    // 값이 같으면 스킵
    if (newValue === oldValue) {
      return;
    }

    // 이벤트 핸들러 처리
    const eventType = getEventType(key);
    if (eventType && typeof oldValue === "function") {
      removeEvent(target, eventType, oldValue);
    }
    if (eventType && typeof newValue === "function") {
      addEvent(target, eventType, newValue);
      return;
    }

    // className 처리
    if (key === "className") {
      if (newValue === undefined || newValue === null || newValue === "") {
        target.className = "";
        target.removeAttribute("class");
      } else {
        target.className = newValue;
      }
      return;
    }

    // boolean 속성 처리
    if (key === "checked") {
      target.checked = newValue === true;
      return;
    }

    if (key === "disabled") {
      target.disabled = newValue === true;
      if (newValue === true) {
        target.setAttribute("disabled", "");
      } else {
        target.removeAttribute("disabled");
      }
      return;
    }

    if (key === "selected") {
      target.selected = newValue === true;
      return;
    }

    if (key === "readOnly" || key === "readonly") {
      target.readOnly = newValue === true;
      if (newValue === true) {
        target.setAttribute("readonly", "");
      } else {
        target.removeAttribute("readonly");
      }
      return;
    }

    // data- 속성 처리
    if (key.startsWith("data-")) {
      if (newValue === undefined || newValue === null) {
        target.removeAttribute(key);
      } else {
        target.setAttribute(key, newValue);
      }
      return;
    }

    // 일반 속성 처리
    if (newValue === undefined || newValue === null || newValue === false) {
      target.removeAttribute(key);
    } else if (newValue === true) {
      target.setAttribute(key, "");
    } else {
      target.setAttribute(key, newValue);
    }
  });
}

export function updateElement(parentElement, newNode, oldNode, index = 0) {
  // 둘 다 텍스트 노드인 경우
  if (
    (typeof newNode === "string" || typeof newNode === "number") &&
    (typeof oldNode === "string" || typeof oldNode === "number")
  ) {
    const textNode = parentElement.childNodes[index];
    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      if (textNode.textContent !== String(newNode)) {
        textNode.textContent = String(newNode);
      }
      return;
    }
    // 텍스트 노드가 아니면 교체
    const newTextNode = document.createTextNode(String(newNode));
    if (parentElement.childNodes[index]) {
      parentElement.replaceChild(newTextNode, parentElement.childNodes[index]);
    } else {
      parentElement.appendChild(newTextNode);
    }
    return;
  }

  // 하나만 텍스트 노드인 경우
  if (typeof newNode === "string" || typeof newNode === "number") {
    const newTextNode = document.createTextNode(String(newNode));
    if (parentElement.childNodes[index]) {
      parentElement.replaceChild(newTextNode, parentElement.childNodes[index]);
    } else {
      parentElement.appendChild(newTextNode);
    }
    return;
  }

  if (typeof oldNode === "string" || typeof oldNode === "number") {
    const newElement = createElement(newNode);
    if (parentElement.childNodes[index]) {
      parentElement.replaceChild(newElement, parentElement.childNodes[index]);
    } else {
      parentElement.appendChild(newElement);
    }
    return;
  }

  // 둘 다 null/undefined인 경우
  if (!newNode && !oldNode) {
    return;
  }

  // newNode가 null/undefined인 경우 제거
  if (!newNode) {
    if (parentElement.childNodes[index]) {
      parentElement.removeChild(parentElement.childNodes[index]);
    }
    return;
  }

  // oldNode가 null/undefined인 경우 추가
  if (!oldNode) {
    const newElement = createElement(newNode);
    if (parentElement.childNodes[index]) {
      parentElement.insertBefore(newElement, parentElement.childNodes[index]);
    } else {
      parentElement.appendChild(newElement);
    }
    return;
  }

  // 타입이 다른 경우 교체
  if (newNode.type !== oldNode.type) {
    const newElement = createElement(newNode);
    if (parentElement.childNodes[index]) {
      parentElement.replaceChild(newElement, parentElement.childNodes[index]);
    } else {
      parentElement.appendChild(newElement);
    }
    return;
  }

  // 같은 타입이면 업데이트
  const existingElement = parentElement.childNodes[index];

  // 속성 업데이트
  updateAttributes(existingElement, newNode.props, oldNode.props);

  // 자식 요소 업데이트
  const newChildren = newNode.children || [];
  const oldChildren = oldNode.children || [];
  const maxLength = Math.max(newChildren.length, oldChildren.length);

  // 기존 자식들을 역순으로 제거 (인덱스 문제 방지)
  for (let i = oldChildren.length - 1; i >= newChildren.length; i--) {
    if (existingElement.childNodes[i]) {
      existingElement.removeChild(existingElement.childNodes[i]);
    }
  }

  // 자식 요소들을 업데이트하거나 추가
  for (let i = 0; i < maxLength; i++) {
    const newChild = newChildren[i];
    const oldChild = oldChildren[i];

    if (i < newChildren.length) {
      updateElement(existingElement, newChild, oldChild, i);
    }
  }
}
