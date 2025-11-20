import { addEvent, removeEvent } from "./eventManager";
import { createElement } from "./createElement.js";

function updateAttributes(target, newProps, oldProps) {
  // 1. oldProps에 있지만 newProps에 없는 속성 제거
  Object.keys(oldProps).forEach((key) => {
    if (!(key in newProps)) {
      // 이벤트 핸들러 제거
      if (key.startsWith("on")) {
        const eventType = key.slice(2).toLowerCase();
        removeEvent(target, eventType, oldProps[key]);
        return;
      }

      // className 제거
      if (key === "className") {
        target.removeAttribute("class");
        return;
      }

      // boolean props 제거
      if (
        key === "checked" ||
        key === "disabled" ||
        key === "selected" ||
        key === "readOnly"
      ) {
        target[key] = false;
        return;
      }

      // 일반 속성 제거
      target.removeAttribute(key);
    }
  });

  // 2. newProps의 속성 추가/업데이트
  Object.entries(newProps).forEach(([key, value]) => {
    // 값이 동일하면 스킵 (최적화)
    if (oldProps[key] === value) return;

    // 이벤트 핸들러
    if (key.startsWith("on")) {
      const eventType = key.slice(2).toLowerCase();
      // 기존 핸들러 제거
      if (oldProps[key]) {
        removeEvent(target, eventType, oldProps[key]);
      }
      // 새 핸들러 등록
      addEvent(target, eventType, value);
      return;
    }

    // className
    if (key === "className") {
      target.setAttribute("class", value);
      return;
    }

    // boolean props (checked, disabled, selected, readOnly 등)
    // property로 직접 설정
    if (
      key === "checked" ||
      key === "disabled" ||
      key === "selected" ||
      key === "readOnly"
    ) {
      target[key] = value;
      return;
    }

    // 일반 속성
    target.setAttribute(key, value);
  });
}

export function updateElement(parentElement, newNode, oldNode, index = 0) {
  // 1. oldNode만 있는 경우 - 노드 제거
  if (!newNode && oldNode) {
    parentElement.removeChild(parentElement.childNodes[index]);
    return;
  }

  // 2. newNode만 있는 경우 - 노드 추가
  if (newNode && !oldNode) {
    parentElement.appendChild(createElement(newNode));
    return;
  }

  // 3. 둘 다 텍스트 노드인 경우 - 텍스트 업데이트
  const isNewNodeText =
    typeof newNode === "string" || typeof newNode === "number";
  const isOldNodeText =
    typeof oldNode === "string" || typeof oldNode === "number";

  if (isNewNodeText && isOldNodeText) {
    if (newNode !== oldNode) {
      parentElement.childNodes[index].textContent = String(newNode);
    }
    return;
  }

  // 텍스트 노드에서 요소 노드로 또는 그 반대로 변경된 경우
  if (isNewNodeText !== isOldNodeText) {
    parentElement.replaceChild(
      createElement(newNode),
      parentElement.childNodes[index],
    );
    return;
  }

  // 4. 타입이 다른 경우 - 노드 교체
  if (newNode.type !== oldNode.type) {
    parentElement.replaceChild(
      createElement(newNode),
      parentElement.childNodes[index],
    );
    return;
  }

  // 5. 같은 타입 - 속성 업데이트 및 자식 재귀 업데이트
  const targetElement = parentElement.childNodes[index];

  // 속성 업데이트
  updateAttributes(targetElement, newNode.props || {}, oldNode.props || {});

  // 자식 노드 재귀 업데이트
  const newChildren = newNode.children || [];
  const oldChildren = oldNode.children || [];

  // 공통 자식 업데이트
  const minLength = Math.min(newChildren.length, oldChildren.length);
  for (let i = 0; i < minLength; i++) {
    updateElement(targetElement, newChildren[i], oldChildren[i], i);
  }

  // 새 자식 추가
  for (let i = minLength; i < newChildren.length; i++) {
    targetElement.appendChild(createElement(newChildren[i]));
  }

  // 불필요한 자식 제거 (역순으로)
  for (let i = oldChildren.length - 1; i >= newChildren.length; i--) {
    targetElement.removeChild(targetElement.childNodes[i]);
  }
}
