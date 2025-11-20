import { addEvent, removeEvent } from "./eventManager";
import { createElement } from "./createElement.js";

const SHOULD_SKIP_ATTR = new Set(["children", "key"]); // dom으로 보내지 말아야 하는 속성
const BOOLEAN_WITHOUT_ATTRIBUTE = new Set(["checked", "selected"]); // boolean attribute 속성 (유지해야함)

// 텍스트 노드 확인 (문자나 숫자일 경우 텍스트 노드로 처리)
const isTextNode = (node) =>
  typeof node === "string" || typeof node === "number";

// normalizeVNode 결과를 항상 배열로 받기 위한 유틸 함수
const toChildrenArray = (children) =>
  Array.isArray(children) ? children : children ? [children] : [];

// oldNode가 존재하고 newNode가 없을 때 기존 요소 제거
function removeDomChild(parentElement, index) {
  const existing = parentElement.childNodes[index];
  if (existing) {
    parentElement.removeChild(existing);
  }
}

// newNode가 존재하고 oldNode가 없을 때 새 요소 추가
function insertDomChild(parentElement, node, index) {
  const referenceNode = parentElement.childNodes[index] ?? null;
  // 새 요소 생성
  const newElement = createElement(node);
  parentElement.insertBefore(newElement, referenceNode);
}

// 새로운 DOM요소로 교체 (type이 다르거나 text<->요소 DOM 일 경우)
function replaceDomChild(parentElement, target, index) {
  const existing = parentElement.childNodes[index];
  if (existing) {
    parentElement.replaceChild(target, existing);
  } else {
    parentElement.appendChild(target);
  }
}

// props 차이 처리 (모든 속성)
function updateAttributes(target, originNewProps, originOldProps) {
  const newProps = originNewProps ?? {};
  const oldProps = originOldProps ?? {};
  // 모든 key를 가져와서 비교
  const keys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);

  keys.forEach((key) => {
    if (SHOULD_SKIP_ATTR.has(key)) return;

    const newValue = newProps[key];
    const oldValue = oldProps[key];
    if (newValue === oldValue) return;

    // 이벤트 핸들러
    if (key.startsWith("on")) {
      const eventType = key.slice(2).toLowerCase();
      // 이벤트는 리스너로 등록, 해제 해주기
      if (oldValue) {
        removeEvent(target, eventType, oldValue);
      }
      if (newValue) {
        addEvent(target, eventType, newValue);
      }
      return;
    }

    const attrName = key === "className" ? "class" : key;
    // className 처리
    if (newValue === undefined || newValue === null) {
      target.removeAttribute(attrName);
      if (attrName in target) {
        target[attrName] = typeof target[attrName] === "boolean" ? false : "";
      }
      return;
    }

    if (key === "className") {
      target.setAttribute("class", newValue);
      return;
    }

    if (typeof newValue === "boolean") {
      // 값이 중요한게 아닌 속성의 존재 여부 판단해야 함 -> 전역 변수로 빼둔 배열로 판단
      target[key] = newValue;
      if (BOOLEAN_WITHOUT_ATTRIBUTE.has(key)) {
        target.removeAttribute(attrName);
        return;
      }
      if (newValue) {
        target.setAttribute(attrName, "");
      } else {
        target.removeAttribute(attrName);
      }
      return;
    }

    if (key.startsWith("data-")) {
      target.setAttribute(key, newValue);
      return;
    }

    if (attrName in target) {
      target[attrName] = newValue;
    }
    target.setAttribute(attrName, newValue);
  });
}

function reconcileChildren(targetElement, newChildren, oldChildren) {
  const sharedLength = Math.min(newChildren.length, oldChildren.length);

  for (let i = 0; i < sharedLength; i += 1) {
    updateElement(targetElement, newChildren[i], oldChildren[i], i);
  }

  if (newChildren.length > oldChildren.length) {
    for (let i = sharedLength; i < newChildren.length; i += 1) {
      updateElement(targetElement, newChildren[i], undefined, i);
    }
  } else if (oldChildren.length > newChildren.length) {
    for (let i = oldChildren.length - 1; i >= sharedLength; i -= 1) {
      updateElement(targetElement, undefined, oldChildren[i], i);
    }
  }
}

// newNode와 oldNode 비교해서 변경된 부분 업데이트
export function updateElement(parentElement, newNode, oldNode, index = 0) {
  // 존재하지 않을경우 undefined가 아닌 null로 명시
  const existingElement = parentElement.childNodes[index] ?? null;

  // newNode가 없으면 oldNode 삭제
  if (newNode === undefined || newNode === null) {
    if (oldNode !== undefined && oldNode !== null) {
      // 기존 요소 제거
      removeDomChild(parentElement, index);
    }
    return;
  }
  // oldNode 없이면 새로 추가
  if (oldNode === undefined || oldNode === null) {
    insertDomChild(parentElement, newNode, index);
    return;
  }

  const newIsText = isTextNode(newNode);
  const oldIsText = isTextNode(oldNode);

  // 텍스트 노드 처리
  if (newIsText || oldIsText) {
    // 둘 다 텍스트 노드인 경우
    if (newIsText && oldIsText) {
      const newText = newNode.toString();
      // 기존 요소와 새 텍스트 비교해서 변경된 부분 업데이트
      if (existingElement && existingElement.textContent !== newText) {
        existingElement.textContent = newText;
      }
    } else {
      // 하나는 텍스트 노드이고 하나는 요소 노드인 경우
      // 새 요소 생성하고 기존 요소 교체
      const replacement = createElement(newNode);
      replaceDomChild(parentElement, replacement, index);
    }
    return;
  }
  // 요소 노드 처리
  if (newNode.type !== oldNode.type) {
    // 타입이 다른 경우  새 요소 생성하고 기존 요소 교체
    const replacement = createElement(newNode);
    replaceDomChild(parentElement, replacement, index);
    return;
  }

  if (existingElement) {
    updateAttributes(existingElement, newNode.props, oldNode.props);
    const newChildren = toChildrenArray(newNode.children);
    const oldChildren = toChildrenArray(oldNode.children);
    if (newChildren.length > 0 || oldChildren.length > 0) {
      reconcileChildren(existingElement, newChildren, oldChildren);
    }
  }
}
