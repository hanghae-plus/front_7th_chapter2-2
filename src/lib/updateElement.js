import { addEvent, removeEvent } from "./eventManager";
import { createElement } from "./createElement.js";

function updateAttributes(target, originNewProps, originOldProps) {
  const newProps = originNewProps || {};
  const oldProps = originOldProps || {};

  // 1) 이전 props에만 있는 속성 제거
  for (const key in oldProps) {
    if (!(key in newProps)) {
      // className 제거 시 class 속성도 제거
      if (key === "className") {
        target.className = "";
        target.removeAttribute("class");
      }
      // 이벤트 핸들러 제거
      else if (key.startsWith("on")) {
        const eventType = key.slice(2).toLowerCase();
        const oldHandler = oldProps[key];
        if (oldHandler) {
          removeEvent(target, eventType, oldHandler);
        }
      }
      // boolean props 제거
      else if (key === "checked" || key === "selected") {
        target[key] = false;
      } else if (key === "disabled") {
        target.disabled = false;
        target.removeAttribute("disabled");
      } else if (key === "readOnly") {
        target.readOnly = false;
        target.removeAttribute("readonly");
      }
      // 일반 속성 제거
      else {
        target.removeAttribute(key);
      }
    }
  }

  // 2) 새로운 props 순회 (추가/업데이트)
  for (const key in newProps) {
    const newValue = newProps[key];
    const oldValue = oldProps[key];

    // 이벤트 핸들러 처리
    if (key.startsWith("on")) {
      const eventType = key.slice(2).toLowerCase(); // "onClick" → "click"
      // 이전 핸들러 제거
      if (oldValue) {
        removeEvent(target, eventType, oldValue);
      }
      // 새 핸들러 추가
      if (newValue) {
        addEvent(target, eventType, newValue);
      }
    }
    // boolean props 처리
    else if (key === "checked" || key === "selected") {
      target[key] = newValue;
      // attribute는 설정하지 않음
    } else if (key === "disabled") {
      target.disabled = newValue;
      if (newValue) {
        target.setAttribute("disabled", "");
      } else {
        target.removeAttribute("disabled");
      }
    } else if (key === "readOnly") {
      target.readOnly = newValue;
      if (newValue) {
        target.setAttribute("readonly", "");
      } else {
        target.removeAttribute("readonly");
      }
    }
    // className 처리
    else if (key === "className") {
      if (newValue) {
        target.className = newValue;
        target.setAttribute("class", newValue);
      } else {
        target.className = "";
        target.removeAttribute("class");
      }
    }
    // 일반 속성
    else {
      target.setAttribute(key, newValue);
    }
  }
}

export function updateElement(parentElement, newNode, oldNode, index = 0) {
  const existNode = parentElement.childNodes[index];

  if (
    (oldNode === null || oldNode === undefined) &&
    newNode !== null &&
    newNode !== undefined
  ) {
    const newElement = createElement(newNode);
    parentElement.insertBefore(newElement, existNode || null);
    return;
  }

  if (
    oldNode !== null &&
    oldNode !== undefined &&
    (newNode === null || newNode === undefined)
  ) {
    if (existNode) {
      parentElement.removeChild(existNode);
    }
    return;
  }

  if (newNode && oldNode) {
    // 텍스트 노드 처리 (문자열 또는 숫자)
    if (
      (typeof newNode === "string" || typeof newNode === "number") &&
      (typeof oldNode === "string" || typeof oldNode === "number")
    ) {
      if (existNode && existNode.nodeType === Node.TEXT_NODE) {
        // 텍스트 노드 내용 업데이트
        if (existNode.textContent !== String(newNode)) {
          existNode.textContent = String(newNode);
        }
      } else {
        // 텍스트 노드가 아니면 교체
        const newElement = createElement(newNode);
        if (existNode) {
          parentElement.replaceChild(newElement, existNode);
        } else {
          parentElement.appendChild(newElement);
        }
      }
      return;
    }

    // 객체인경우
    if (
      typeof newNode === "object" &&
      typeof oldNode === "object" &&
      newNode !== null &&
      oldNode !== null
    ) {
      if (oldNode.type === newNode.type) {
        if (existNode) {
          updateAttributes(existNode, newNode.props, oldNode.props);
          // 속성을 업데이트 후 밑의 자식들 업데이트
          // 자식 업데이트 로직 구현
          const newChildren = newNode.children || [];
          const oldChildren = oldNode.children || [];
          const maxLength = Math.max(newChildren.length, oldChildren.length);

          // 각 인덱스별로 업데이트, 추가, 제거 처리
          // DOM 변경으로 인덱스가 어긋날 수 있으므로 동적으로 추적
          let currentIndex = 0;
          for (let i = 0; i < maxLength; i++) {
            const newChild = newChildren[i];
            const oldChild = oldChildren[i];
            const existChild = existNode.childNodes[currentIndex];

            if (newChild !== undefined && oldChild !== undefined) {
              // 둘 다 존재하면 타입 비교
              const newChildType =
                typeof newChild === "string" ? "text" : newChild?.type;
              const oldChildType =
                typeof oldChild === "string" ? "text" : oldChild?.type;

              if (newChildType === oldChildType) {
                // 타입이 같으면 업데이트
                updateElement(existNode, newChild, oldChild, currentIndex);
                currentIndex++;
              } else {
                // 타입이 다르면 교체
                const newElement = createElement(newChild);
                if (existChild) {
                  existNode.replaceChild(newElement, existChild);
                } else {
                  existNode.appendChild(newElement);
                }
                currentIndex++;
              }
            } else if (newChild !== undefined && oldChild === undefined) {
              // 새 자식만 존재하면 추가
              const newElement = createElement(newChild);
              if (existChild) {
                existNode.insertBefore(newElement, existChild);
              } else {
                existNode.appendChild(newElement);
              }
              currentIndex++;
            } else if (newChild === undefined && oldChild !== undefined) {
              // 이전 자식만 존재하면 제거
              if (existChild) {
                existNode.removeChild(existChild);
                // 제거했으므로 currentIndex는 증가하지 않음
              }
            }
          }
        }
      } else {
        if (existNode) {
          const newElement = createElement(newNode);
          parentElement.replaceChild(newElement, existNode);
        }
      }
    }
  }
}
