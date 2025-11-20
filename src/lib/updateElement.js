import { addEvent, removeEvent } from './eventManager';
import { createElement } from './createElement.js';

function updateAttributes(target, originNewProps, originOldProps) {
  const newProps = originNewProps || {};
  const oldProps = originOldProps || {};

  for (const key in oldProps) {
    if (!(key in newProps)) {
      if (key.startsWith('on')) {
        // 이벤트 핸들러 제거
        const eventType = key.slice(2).toLowerCase();
        removeEvent(target, eventType, oldProps[key]);
      } else if (key === 'className') {
        target.removeAttribute('class');
      } else if (key === 'checked' || key === 'selected') {
        target[key] = false;
      } else if (typeof oldProps[key] === 'boolean') {
        target[key] = false;
        target.removeAttribute(key);
      } else {
        target.removeAttribute(key);
      }
    }
  }

  // 새로운 또는 변경된 속성 처리
  for (const key in newProps) {
    if (oldProps[key] !== newProps[key]) {
      if (key.startsWith('on')) {
        // 이벤트 핸들러 업데이트
        const eventType = key.slice(2).toLowerCase();
        if (oldProps[key]) {
          removeEvent(target, eventType, oldProps[key]);
        }
        addEvent(target, eventType, newProps[key]);
      } else if (key === 'className') {
        target.setAttribute('class', newProps[key]);
      } else if (key === 'checked' || key === 'selected') {
        // boolean 속성은 property로 직접 설정
        target[key] = newProps[key];
      } else if (typeof newProps[key] === 'boolean') {
        target[key] = newProps[key];
        if (newProps[key]) {
          target.setAttribute(key, '');
        } else {
          target.removeAttribute(key);
        }
      } else {
        target.setAttribute(key, newProps[key]);
      }
    }
  }
}

export function updateElement(parentElement, newNode, oldNode, index = 0) {
  // 새 노드가 없으면 기존 노드 제거
  if (!newNode && oldNode) {
    const nodeToRemove = parentElement.childNodes[index];
    if (nodeToRemove) {
      parentElement.removeChild(nodeToRemove);
    }
    return;
  }

  // 기존 노드가 없으면 새 노드 추가
  if (newNode && !oldNode) {
    parentElement.appendChild(createElement(newNode));
    return;
  }

  // 둘 다 문자열이나 숫자인 경우
  if (
    typeof newNode === 'string' ||
    typeof newNode === 'number' ||
    typeof oldNode === 'string' ||
    typeof oldNode === 'number'
  ) {
    if (newNode !== oldNode) {
      parentElement.replaceChild(
        createElement(newNode),
        parentElement.childNodes[index]
      );
    }
    return;
  }

  // 타입이 다르면 교체
  if (newNode.type !== oldNode.type) {
    parentElement.replaceChild(
      createElement(newNode),
      parentElement.childNodes[index]
    );
    return;
  }

  const currentElement = parentElement.childNodes[index];
  updateAttributes(currentElement, newNode.props, oldNode.props);

  const newChildren = newNode.children || [];
  const oldChildren = oldNode.children || [];

  if (oldChildren.length > newChildren.length) {
    for (let i = oldChildren.length - 1; i >= newChildren.length; i--) {
      const childToRemove = currentElement.childNodes[i];
      if (childToRemove) {
        currentElement.removeChild(childToRemove);
      }
    }
  }

  const minLength = Math.min(newChildren.length, oldChildren.length);

  for (let i = 0; i < minLength; i++) {
    updateElement(currentElement, newChildren[i], oldChildren[i], i);
  }

  for (let i = minLength; i < newChildren.length; i++) {
    updateElement(currentElement, newChildren[i], null, i);
  }
}
