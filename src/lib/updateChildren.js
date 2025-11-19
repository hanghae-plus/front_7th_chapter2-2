import { createElement } from "./createElement";

// ========== Helper 함수 ==========

// VNode에서 key 값을 추출
function getNodeKey(vNode) {
  if (!vNode || typeof vNode !== "object") return null;
  return vNode.props?.key ?? null;
}

// children 배열에 key를 가진 노드가 있는지 확인
// 모든 노드가 key를 가지고 있어야 true (일부만 가진 경우는 false)
function hasKeys(children) {
  if (children.length === 0) return false;
  return children.every((child) => {
    // 텍스트 노드는 key가 없어도 OK
    if (typeof child === "string" || typeof child === "number") return true;
    return getNodeKey(child) != null;
  });
}

// ========== Children 업데이트 ==========

export function updateChildren(parentElement, newChildren, oldChildren, updateElementFn) {
  // Key가 있으면 최적화된 방식, 없으면 인덱스 기반
  if (hasKeys(newChildren)) {
    updateChildrenWithKeys(parentElement, newChildren, oldChildren, updateElementFn);
  } else {
    updateChildrenByIndex(parentElement, newChildren, oldChildren, updateElementFn);
  }
}

// 인덱스 기반 업데이트 (기존 방식)
function updateChildrenByIndex(parentElement, newChildren, oldChildren, updateElementFn) {
  // 공통 children 업데이트
  const minLength = Math.min(newChildren.length, oldChildren.length);
  for (let i = 0; i < minLength; i++) {
    updateElementFn(parentElement, newChildren[i], oldChildren[i], i);
  }

  // 새로운 children 추가
  if (newChildren.length > oldChildren.length) {
    for (let i = minLength; i < newChildren.length; i++) {
      parentElement.appendChild(createElement(newChildren[i]));
    }
  }

  // 남은 children 제거 (역순으로!)
  if (oldChildren.length > newChildren.length) {
    for (let i = oldChildren.length - 1; i >= newChildren.length; i--) {
      parentElement.removeChild(parentElement.childNodes[i]);
    }
  }
}

// Key 기반 업데이트 (최적화된 방식)
function updateChildrenWithKeys(parentElement, newChildren, oldChildren, updateElementFn) {
  // 1. oldChildren을 key -> DOM 노드와 vNode로 매핑
  const oldKeyToVNode = new Map();
  const oldKeyToDomNode = new Map();

  oldChildren.forEach((child, index) => {
    const key = getNodeKey(child);
    if (key != null) {
      oldKeyToVNode.set(key, child);
      // 실제 DOM 노드도 저장
      const domNode = parentElement.childNodes[index];
      if (domNode) {
        oldKeyToDomNode.set(key, domNode);
      }
    }
  });

  // 2. newChildren을 순회하며 DOM을 재구성
  newChildren.forEach((newChild, newIndex) => {
    const newKey = getNodeKey(newChild);

    if (newKey != null && oldKeyToDomNode.has(newKey)) {
      // 기존 노드 재사용
      const oldDomNode = oldKeyToDomNode.get(newKey);
      const oldVNode = oldKeyToVNode.get(newKey);

      // 현재 newIndex 위치에 있어야 할 노드
      const currentNodeAtPosition = parentElement.childNodes[newIndex];

      // 노드가 올바른 위치에 없으면 이동
      if (oldDomNode !== currentNodeAtPosition) {
        parentElement.insertBefore(oldDomNode, currentNodeAtPosition || null);
      }

      // 내용 업데이트 (속성 및 자식 재귀 업데이트)
      updateElementFn(parentElement, newChild, oldVNode, newIndex);

      // 사용한 key 제거
      oldKeyToDomNode.delete(newKey);
      oldKeyToVNode.delete(newKey);
    } else if (newKey != null) {
      // 새로운 노드 생성
      const newDomNode = createElement(newChild);
      const referenceNode = parentElement.childNodes[newIndex];
      parentElement.insertBefore(newDomNode, referenceNode || null);
    } else {
      // key가 없는 노드: 인덱스 기반으로 처리
      const oldChild = oldChildren[newIndex];
      const existingNode = parentElement.childNodes[newIndex];

      if (existingNode && oldChild) {
        updateElementFn(parentElement, newChild, oldChild, newIndex);
      } else if (!existingNode) {
        parentElement.appendChild(createElement(newChild));
      }
    }
  });

  // 3. 사용되지 않은 old 노드들 제거
  oldKeyToDomNode.forEach((domNode) => {
    if (domNode.parentNode === parentElement) {
      parentElement.removeChild(domNode);
    }
  });

  // 4. 길이가 맞지 않으면 남은 노드 제거
  while (parentElement.childNodes.length > newChildren.length) {
    parentElement.removeChild(parentElement.lastChild);
  }
}
