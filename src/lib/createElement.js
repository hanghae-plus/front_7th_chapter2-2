import { addEvent } from './eventManager';

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

export function createElement(vNode) {
  // 빈 텍스트 노드로 변환된다.
  if (
    vNode === undefined ||
    vNode === null ||
    vNode === false ||
    vNode === true
  ) {
    return document.createTextNode('');
  }

  // 문자열 노드로 변환된다.
  if (typeof vNode === 'string' || typeof vNode === 'number') {
    return document.createTextNode(String(vNode));
  }

  // 배열 입력에 대해 DocumentFragment를 생성해야 한다
  if (Array.isArray(vNode)) {
    const fragment = document.createDocumentFragment();
    if (vNode.length === 0) {
      return fragment;
    }
    //  [
    //    { type: "div", props: null, children: ["첫 번째"] },
    //    { type: "span", props: null, children: ["두 번째"] },
    //  ];
    vNode.forEach((node) => {
      fragment.appendChild(createElement(node));
    });
    return fragment;
  }

  // { type: "div", props: null, children: ["첫 번째"] },
  if (
    typeof vNode === 'object' &&
    vNode.type &&
    typeof vNode.type === 'string'
  ) {
    const $element = document.createElement(vNode.type);

    // props 설정

    if (vNode.props) {
      Object.entries(vNode.props).forEach(([key, value]) => {
        const attrName = key === 'className' ? 'class' : key;

        if (attrName.startsWith('on')) {
          const eventType = attrName.slice(2).toLowerCase();
          addEvent($element, eventType, value);
        } else {
          setElementProperty($element, key, value);
        }
      });
    }

    // 자식 노드 처리
    if (vNode.children) {
      vNode.children.forEach((child) => {
        $element.appendChild(createElement(child));
      });
    }
    return $element;
  }

  // 컴포넌트를 createElement로 처리하려고 하면 오류가 발생한다.
  if (typeof vNode.type === 'function') {
    throw new Error();
  }
}
