import { addEvent } from './eventManager';

export function createElement(vNode) {
  if (vNode === null || vNode === undefined || typeof vNode === 'boolean') {
    return document.createTextNode('');
  }

  if (typeof vNode === 'string' || typeof vNode === 'number') {
    return document.createTextNode(String(vNode));
  }

  if (Array.isArray(vNode)) {
    const fragment = document.createDocumentFragment();
    vNode.forEach((child) => {
      fragment.appendChild(createElement(child));
    });
    return fragment;
  }

  if (typeof vNode.type === 'function') {
    throw new Error(
      'Function components must be normalized before createElement'
    );
  }

  if (vNode && typeof vNode === 'object' && vNode.type) {
    const element = document.createElement(vNode.type);

    if (vNode.props) {
      updateAttributes(element, vNode.props);
    }

    if (vNode.children) {
      vNode.children.forEach((child) => {
        const childElement = createElement(child);
        element.appendChild(childElement);
      });
    }

    return element;
  }

  return document.createTextNode('');
}

function updateAttributes($el, props) {
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('on') && typeof value === 'function') {
      const eventType = key.slice(2).toLowerCase();
      addEvent($el, eventType, value);
      continue;
    }

    if (key === 'className') {
      $el.setAttribute('class', value);
      continue;
    }

    if (key.startsWith('data-')) {
      $el.setAttribute(key, value);
      continue;
    }

    if (typeof value === 'boolean') {
      if (value) {
        $el.setAttribute(key, key);
        $el[key] = true;
      }
      continue;
    }

    if (value !== null && value !== undefined) {
      $el.setAttribute(key, value);
    }
  }
}
