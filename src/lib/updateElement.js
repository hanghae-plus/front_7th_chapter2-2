import { addEvent, removeEvent } from "./eventManager";
import { createElement } from "./createElement.js";

function updateAttributes(target, newProps, oldProps) {
  const allKeys = new Set([
    ...(newProps ? Object.keys(newProps) : []),
    ...(oldProps ? Object.keys(oldProps) : []),
  ]);

  allKeys.forEach((key) => {
    const newValue = newProps?.[key];
    const oldValue = oldProps?.[key];

    // 값이 같으면 스킵
    if (newValue === oldValue) return;

    // 이벤트 핸들러 처리
    if (key.startsWith("on") && typeof oldValue === "function") {
      const eventType = key.slice(2).toLowerCase();
      removeEvent(target, eventType, oldValue);
    }

    if (key.startsWith("on") && typeof newValue === "function") {
      const eventType = key.slice(2).toLowerCase();
      addEvent(target, eventType, newValue);
      return;
    }

    // className 처리
    if (key === "className") {
      if (newValue !== null && newValue !== undefined) {
        target.setAttribute("class", newValue || "");
      } else {
        target.removeAttribute("class");
      }
      return;
    }

    // 불리언 속성 처리
    if (typeof newValue === "boolean") {
      // checked와 selected는 DOM 속성 없이 property만 사용
      const isPropertyOnly = key === "checked" || key === "selected";

      if (newValue) {
        if (isPropertyOnly) {
          // property만 설정, DOM 속성은 설정하지 않음
          if (key in target) {
            target[key] = true;
          }
        } else {
          // 일반 boolean 속성은 DOM 속성도 설정
          target.setAttribute(key, "");
          if (key in target) {
            target[key] = true;
          }
        }
      } else {
        // false일 때는 항상 제거
        target.removeAttribute(key);
        if (key in target) {
          target[key] = false;
        }
      }
      return;
    }

    // data-* 속성 처리
    if (key.startsWith("data-")) {
      const dataKey = key
        .slice(5)
        .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      if (newValue !== null && newValue !== undefined) {
        target.dataset[dataKey] = newValue;
      } else {
        delete target.dataset[dataKey];
      }
      return;
    }

    // 일반 속성 처리
    if (newValue !== null && newValue !== undefined) {
      target.setAttribute(key, newValue);
      if (key in target) {
        target[key] = newValue;
      }
    } else {
      target.removeAttribute(key);
      if (key in target) {
        target[key] = null;
      }
    }
  });
}

export function updateElement(parentElement, newNode, oldNode, index = 0) {
  if (!parentElement) return;

  const currentChild = parentElement.childNodes[index];

  // 새 노드가 없으면 기존 노드 제거
  if (!newNode || newNode === null || newNode === undefined) {
    if (currentChild) {
      parentElement.removeChild(currentChild);
    }
    return;
  }

  // 이전 노드가 없으면 새 노드 추가
  if (!oldNode || oldNode === null || oldNode === undefined) {
    const newElement = createElement(newNode);
    if (newElement) {
      if (index < parentElement.childNodes.length) {
        parentElement.insertBefore(newElement, parentElement.childNodes[index]);
      } else {
        parentElement.appendChild(newElement);
      }
    }
    return;
  }

  // 둘 다 문자열/숫자인 경우
  if (
    (typeof newNode === "string" || typeof newNode === "number") &&
    (typeof oldNode === "string" || typeof oldNode === "number")
  ) {
    if (String(newNode) !== String(oldNode)) {
      if (currentChild && currentChild.nodeType === Node.TEXT_NODE) {
        currentChild.textContent = String(newNode);
      } else {
        const textNode = document.createTextNode(String(newNode));
        if (currentChild) {
          parentElement.replaceChild(textNode, currentChild);
        } else {
          parentElement.appendChild(textNode);
        }
      }
    }
    return;
  }

  // 새 노드가 문자열/숫자이고 이전 노드가 다른 타입인 경우
  if (typeof newNode === "string" || typeof newNode === "number") {
    const textNode = document.createTextNode(String(newNode));
    if (currentChild) {
      parentElement.replaceChild(textNode, currentChild);
    } else {
      parentElement.appendChild(textNode);
    }
    return;
  }

  // 이전 노드가 문자열/숫자이고 새 노드가 다른 타입인 경우
  if (typeof oldNode === "string" || typeof oldNode === "number") {
    const newElement = createElement(newNode);
    if (newElement) {
      if (currentChild) {
        parentElement.replaceChild(newElement, currentChild);
      } else {
        parentElement.appendChild(newElement);
      }
    }
    return;
  }

  // 둘 다 VNode 객체인 경우
  if (
    typeof newNode === "object" &&
    newNode !== null &&
    "type" in newNode &&
    typeof oldNode === "object" &&
    oldNode !== null &&
    "type" in oldNode
  ) {
    // 타입이 다르면 교체
    if (newNode.type !== oldNode.type) {
      const newElement = createElement(newNode);
      if (newElement) {
        if (currentChild) {
          parentElement.replaceChild(newElement, currentChild);
        } else {
          parentElement.appendChild(newElement);
        }
      }
      return;
    }

    // 타입이 같으면 속성과 자식 업데이트
    if (currentChild && currentChild.nodeType === Node.ELEMENT_NODE) {
      // 속성 업데이트
      updateAttributes(currentChild, newNode.props, oldNode.props);

      // 자식 업데이트
      const newChildren = newNode.children || [];
      const oldChildren = oldNode.children || [];
      const maxLength = Math.max(newChildren.length, oldChildren.length);

      // 기존 자식들을 역순으로 제거 (인덱스가 변경되지 않도록)
      for (let i = maxLength - 1; i >= 0; i--) {
        if (i >= newChildren.length) {
          // 새 자식이 없으면 제거
          if (currentChild.childNodes[i]) {
            currentChild.removeChild(currentChild.childNodes[i]);
          }
        } else {
          // 자식 업데이트
          updateElement(currentChild, newChildren[i], oldChildren[i], i);
        }
      }
    }
    return;
  }

  // 그 외의 경우는 새 노드로 교체
  const newElement = createElement(newNode);
  if (newElement) {
    if (currentChild) {
      parentElement.replaceChild(newElement, currentChild);
    } else {
      parentElement.appendChild(newElement);
    }
  }
}
