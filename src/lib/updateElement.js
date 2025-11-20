import { addEvent, removeEvent } from "./eventManager";
import { createElement } from "./createElement.js";

// Boolean 속성 목록 (property만 사용)
const PROPERTY_ONLY_BOOLEAN_PROPS = ["checked", "selected"];

// Boolean 속성 목록 (property + attribute 모두 사용)
const BOOLEAN_PROPS = ["disabled", "readOnly", "multiple", "isMap"];

function updateAttributes(target, originNewProps, originOldProps) {
  const newProps = originNewProps || {};
  const oldProps = originOldProps || {};

  // 이전 속성 제거 및 이벤트 제거
  Object.keys(oldProps).forEach((key) => {
    if (!(key in newProps)) {
      // 이벤트 리스너 제거
      if (key.startsWith("on") && typeof oldProps[key] === "function") {
        const eventType = key.slice(2).toLowerCase();
        removeEvent(target, eventType, oldProps[key]);
      }
      // className 제거
      else if (key === "className") {
        target.removeAttribute("class");
      }
      // Property만 사용하는 Boolean 속성 제거
      else if (PROPERTY_ONLY_BOOLEAN_PROPS.includes(key)) {
        target[key] = false;
        // DOM attribute는 건드리지 않음
      }
      // Property + Attribute 사용하는 Boolean 속성 제거
      else if (BOOLEAN_PROPS.includes(key)) {
        target[key] = false;
        if (target.hasAttribute(key)) {
          target.removeAttribute(key);
        }
      }
      // 일반 속성 제거
      else {
        target.removeAttribute(key);
      }
    }
  });

  // 새 속성 추가 및 업데이트
  Object.entries(newProps).forEach(([key, value]) => {
    // 값이 변경되지 않았으면 건너뜀
    if (oldProps[key] === value) return;

    // 이벤트 리스너 처리
    if (key.startsWith("on") && typeof value === "function") {
      const eventType = key.slice(2).toLowerCase();
      // 이전 핸들러 제거
      if (oldProps[key]) {
        removeEvent(target, eventType, oldProps[key]);
      }
      // 새 핸들러 추가
      addEvent(target, eventType, value);
    }
    // className 처리
    else if (key === "className") {
      target.setAttribute("class", value);
    }
    // Property만 사용하는 Boolean 속성 (checked, selected)
    else if (PROPERTY_ONLY_BOOLEAN_PROPS.includes(key)) {
      target[key] = value;
      // DOM attribute는 설정하지 않음
    }
    // Property + Attribute 사용하는 Boolean 속성 (disabled 등)
    else if (BOOLEAN_PROPS.includes(key)) {
      target[key] = value;
      if (value) {
        target.setAttribute(key, "");
      } else {
        target.removeAttribute(key);
      }
    }
    // 일반 속성 처리
    else {
      target.setAttribute(key, value);
    }
  });
}

export function updateElement(parentElement, newNode, oldNode, index = 0) {
  // 1. oldNode만 있는 경우 (노드 제거)
  if (!newNode && oldNode) {
    parentElement.removeChild(parentElement.childNodes[index]);
    return;
  }

  // 2. newNode만 있는 경우 (노드 추가)
  if (newNode && !oldNode) {
    parentElement.appendChild(createElement(newNode));
    return;
  }

  // 3. 둘 다 텍스트 노드인 경우
  if (typeof newNode === "string" && typeof oldNode === "string") {
    if (newNode !== oldNode) {
      parentElement.childNodes[index].textContent = newNode;
    }
    return;
  }

  // 4. 하나는 텍스트, 하나는 요소인 경우 (노드 교체)
  if (typeof newNode === "string" || typeof oldNode === "string") {
    parentElement.replaceChild(
      createElement(newNode),
      parentElement.childNodes[index],
    );
    return;
  }

  // 5. 타입이 다른 경우 (노드 교체)
  if (newNode.type !== oldNode.type) {
    parentElement.replaceChild(
      createElement(newNode),
      parentElement.childNodes[index],
    );
    return;
  }

  // 6. 같은 타입의 요소 노드 업데이트
  const targetElement = parentElement.childNodes[index];

  // 속성 업데이트
  updateAttributes(targetElement, newNode.props, oldNode.props);

  // 자식 노드 재귀적 업데이트
  const newChildren = newNode.children || [];
  const oldChildren = oldNode.children || [];

  // 먼저 newChildren.length까지 업데이트
  for (let i = 0; i < newChildren.length; i++) {
    updateElement(targetElement, newChildren[i], oldChildren[i], i);
  }

  // 불필요한 자식 노드 제거 (역순으로 제거)
  for (let i = oldChildren.length - 1; i >= newChildren.length; i--) {
    if (targetElement.childNodes[i]) {
      targetElement.removeChild(targetElement.childNodes[i]);
    }
  }
}
