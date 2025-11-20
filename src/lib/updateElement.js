import { addEvent, removeEvent } from './eventManager';
import { createElement } from './createElement.js';

// Property만 설정하는 attributes (DOM에 표시 안 함)
const PROPERTY_ONLY_ATTRIBUTES = new Set(['checked', 'selected']);

// Property + attribute 모두 설정하는 attributes
const PROPERTY_AND_ATTR_ATTRIBUTES = new Set([
  'disabled',
  'readonly',
  'multiple'
]);

function setElementProperty(element, key, value) {
  let attrName = key === 'className' ? 'class' : key;

  // readOnly → readonly 변환
  if (key === 'readOnly') {
    attrName = 'readonly';
  }

  // Property만 설정하는 attributes
  if (PROPERTY_ONLY_ATTRIBUTES.has(attrName.toLowerCase())) {
    element[key] = value;
    // attribute는 설정하지 않음
  }
  // Property + attribute 모두 설정하는 attributes
  else if (PROPERTY_AND_ATTR_ATTRIBUTES.has(attrName.toLowerCase())) {
    element[key] = value;
    if (value) {
      element.setAttribute(attrName, '');
    } else {
      element.removeAttribute(attrName);
    }
  }
  // 일반 attributes
  else {
    element.setAttribute(attrName, value);
  }
}

function updateAttributes(target, newProps = {}, oldProps = {}) {
  // null/undefined 처리
  newProps = newProps || {};
  oldProps = oldProps || {};

  // 기존 속성 제거
  Object.keys(oldProps).forEach((key) => {
    if (!(key in newProps)) {
      const attrName = key === 'className' ? 'class' : key;
      if (attrName.startsWith('on')) {
        removeEvent(target, attrName.slice(2).toLowerCase(), oldProps[key]);
      } else {
        // Property-only attributes
        if (PROPERTY_ONLY_ATTRIBUTES.has(attrName.toLowerCase())) {
          target[key] = false;
        }
        // Property + attribute attributes
        else if (PROPERTY_AND_ATTR_ATTRIBUTES.has(attrName.toLowerCase())) {
          target[key] = false;
          target.removeAttribute(attrName);
        }
        // 일반 attributes
        else {
          target.removeAttribute(attrName);
        }
      }
    }
  });

  // 새 속성 추가/업데이트
  Object.entries(newProps).forEach(([key, value]) => {
    if (oldProps[key] !== value) {
      const attrName = key === 'className' ? 'class' : key;
      if (attrName.startsWith('on')) {
        const eventType = attrName.slice(2).toLowerCase();
        // 기존 핸들러 제거
        if (oldProps[key]) {
          removeEvent(target, eventType, oldProps[key]);
        }
        // 새 핸들러 추가
        addEvent(target, eventType, value);
      } else {
        setElementProperty(target, key, value);
      }
    }
  });
}

export function updateElement(targetNode, newNode, oldNode) {
  // 1️⃣ newNode가 없으면 기존 요소 제거
  if (newNode === null || newNode === undefined || newNode === false) {
    if (targetNode) {
      targetNode.remove();
    }
    return;
  }

  // 2️⃣ 텍스트/숫자 노드 처리
  if (typeof newNode === 'string' || typeof newNode === 'number') {
    if (targetNode.nodeType === Node.TEXT_NODE) {
      targetNode.textContent = String(newNode);
    } else {
      // 요소 노드를 텍스트 노드로 교체
      const newTextNode = document.createTextNode(String(newNode));
      targetNode.replaceWith(newTextNode);
    }
    return;
  }

  // 3️⃣ VNode 객체 처리
  if (newNode.type) {
    // oldNode가 없거나 타입이 다르면 요소 교체
    if (!oldNode || newNode.type !== oldNode.type) {
      const newElement = createElement(newNode);
      targetNode.replaceWith(newElement);
      return;
    }

    // 같은 타입: 속성과 자식 업데이트
    if (typeof newNode.type === 'string') {
      // HTML 요소: 속성 업데이트
      updateAttributes(targetNode, newNode.props, oldNode?.props);

      // 자식 노드 업데이트
      const newChildren = newNode.children || [];
      const oldChildren = oldNode.children || [];
      const maxLength = Math.max(newChildren.length, oldChildren.length);
      const targetChildren = Array.from(targetNode.childNodes);

      for (let i = 0; i < maxLength; i++) {
        if (i < newChildren.length && i < oldChildren.length) {
          // 기존 자식 업데이트
          if (targetChildren[i]) {
            updateElement(targetChildren[i], newChildren[i], oldChildren[i]);
          } else {
            // 자식이 없으면 새로 추가
            targetNode.appendChild(createElement(newChildren[i]));
          }
        } else if (i < newChildren.length) {
          // 새로운 자식 추가
          targetNode.appendChild(createElement(newChildren[i]));
        } else {
          // 기존 자식 제거
          if (targetChildren[i]) {
            targetChildren[i].remove();
          }
        }
      }
    }
  }
}
