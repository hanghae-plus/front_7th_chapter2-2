import { addEvent, removeEvent } from "./eventManager";
import { createElement } from "./createElement.js";

// 이전 가상 DOM과 새 가상 DOM을 비교해서 최소한의 변경만 실제 DOM에 적용
// // 예시
// 이전: <div>Hello</div>
// 새로: <div>Bye</div>

// 텍스트만 "Hello" → "Bye"로 변경

function updateAttributes(target, originNewProps = {}, originOldProps = {}) {
  // 1. 이전 속성 제거 (newProps에 없는 것들)
  Object.keys(originOldProps).forEach((key) => {
    // children과 key는 속성이 아니므로 스킵
    if (key === "children" || key === "key") {
      return;
    }
    if (!(key in originNewProps)) {
      // 이벤트 제거
      if (key.startsWith("on")) {
        const eventType = key.slice(2).toLowerCase();
        removeEvent(target, eventType, originOldProps[key]);
        return;
      }

      // className 제거
      if (key === "className") {
        target.removeAttribute("class");
        return;
      }

      // Boolean 속성 제거
      if (key === "checked" || key === "disabled" || key === "selected" || key === "readOnly") {
        target[key] = false;
        return;
      }

      // 그 외 일반 속성
      target.removeAttribute(key);
    }
  });
  // 2. 새 속성 추가/업데이트
  Object.entries(originNewProps).forEach(([key, value]) => {
    // children과 key는 속성이 아니므로 스킵
    if (key === "children" || key === "key") {
      return;
    }

    // 값이 변경되지 않았으면 스킵 (최적화)
    if (originOldProps[key] === value) {
      return;
    }

    // 이벤트 핸들러 업데이트
    if (key.startsWith("on")) {
      const eventType = key.slice(2).toLowerCase();
      // 이전 핸들러 제거
      if (originOldProps[key]) {
        removeEvent(target, eventType, originOldProps[key]);
      }
      // 새 핸들러 추가
      addEvent(target, eventType, value);
      return;
    }

    // className 업데이트
    if (key === "className") {
      target.setAttribute("class", value);
      return;
    }

    // Boolean 속성 업데이트
    if (key === "checked" || key === "disabled" || key === "selected" || key === "readOnly") {
      target[key] = value;
      return;
    }

    // 일반 속성 업데이트
    target.setAttribute(key, value);
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
  const newIsText = typeof newNode === "string" || typeof newNode === "number";
  const oldIsText = typeof oldNode === "string" || typeof oldNode === "number";

  if (newIsText && oldIsText) {
    if (newNode !== oldNode) {
      // 텍스트 내용이 다르면 변경
      parentElement.childNodes[index].textContent = newNode;
    }
    return;
  }

  // 4. 타입 변경: div → span 등 (전체 교체)
  if (newNode.type !== oldNode.type) {
    return parentElement.replaceChild(createElement(newNode), parentElement.childNodes[index]);
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
