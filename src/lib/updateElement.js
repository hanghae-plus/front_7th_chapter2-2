import { addEvent, removeEvent } from "./eventManager";
import { createElement } from "./createElement.js";

function updateAttributes(target, originNewProps, originOldProps) {
  const BOOLEAN_ATTRS = ["checked", "disabled", "selected", "readOnly"];

  // 이전 속성 제거
  if (originOldProps) {
    Object.keys(originOldProps).forEach((key) => {
      // newProps에 없는 속성 제거
      if (!originNewProps || !(key in originNewProps)) {
        if (key.startsWith("on")) {
          removeEvent(target, key.slice(2).toLowerCase(), originOldProps[key]);
        } else if (key === "className") {
          target.removeAttribute("class");
        } else if (BOOLEAN_ATTRS.includes(key)) {
          target[key] = false;
        } else {
          target.removeAttribute(key);
        }
      }
    });
  }

  // 새 속성 추가
  if (originNewProps) {
    Object.entries(originNewProps).forEach(([key, value]) => {
      if (originOldProps?.[key] === value) return;

      if (key.startsWith("on") && typeof value === "function") {
        if (originOldProps?.[key]) {
          removeEvent(target, key.slice(2).toLowerCase(), originOldProps[key]);
        }
        // 새 핸들러 추가
        addEvent(target, key.slice(2).toLowerCase(), value);
      } else if (key === "className") {
        target.className = value;
      } else if (BOOLEAN_ATTRS.includes(key)) {
        target[key] = Boolean(value);
      } else if (key === "style") {
        target.style.cssText = Object.entries(value)
          .map(([k, v]) => `${k}: ${v}`)
          .join(";");
      } else {
        target.setAttribute(key, value);
      }
    });
  }
}

export function updateElement(parentElement, newNode, oldNode, index = 0) {
  // children > element만 존재, childNodes > text, comment, element 모두 존재
  const oldChild = parentElement.childNodes[index];

  // 새 노드만 있음 추가
  if (!oldNode && newNode) {
    parentElement.appendChild(createElement(newNode));
    return;
  }

  // 이전 노드만 있음 제거
  if (oldNode && !newNode) {
    parentElement.removeChild(oldChild);
    return;
  }

  const isTextNode = (node) =>
    typeof node === "string" || typeof node === "number";

  // 둘 다 텍스트노드일 때
  if (isTextNode(newNode) && isTextNode(oldNode)) {
    // 내용이 달라졌을 때만 업데이트
    if (String(newNode) !== String(oldNode)) {
      oldChild.textContent = newNode;
    }
    return;
  }

  // 텍스트노드 <-> 요소 타입 → 교체
  if (isTextNode(newNode) !== isTextNode(oldNode)) {
    parentElement.replaceChild(createElement(newNode), oldChild);
    return;
  }

  // 요소 타입이 다름 → 교체
  if (newNode.type !== oldNode.type) {
    parentElement.replaceChild(createElement(newNode), oldChild);
    return;
  }

  // 같은 타입 요소 → 속성 업데이트 + children 재귀
  if (newNode.type === oldNode.type) {
    // 속성 추가/수정/삭제
    updateAttributes(oldChild, newNode.props, oldNode.props);

    const newChildren = newNode.children || [];
    const oldChildren = oldNode.children || [];

    // 공통 부분 업데이트
    const minLength = Math.min(newChildren.length, oldChildren.length);
    for (let i = 0; i < minLength; i++) {
      updateElement(oldChild, newChildren[i], oldChildren[i], i);
    }

    // 새 children 추가
    for (let i = minLength; i < newChildren.length; i++) {
      updateElement(oldChild, newChildren[i], null, i);
    }
    // 초과하는 children 역순으로 제거
    for (let i = oldChildren.length - 1; i >= minLength; i--) {
      updateElement(oldChild, null, oldChildren[i], i);
    }
  }
}
