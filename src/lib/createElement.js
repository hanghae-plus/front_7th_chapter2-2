import { updateAttributes, extractEventHandlers } from "./attributeUtils.js";

export const elementEventHandlers = new WeakMap();

export function getElementEventHandlers(element) {
  return elementEventHandlers.get(element) || [];
}

function createTextNode(vNode) {
  if (
    vNode === null ||
    vNode === undefined ||
    vNode === false ||
    vNode === true
  ) {
    return document.createTextNode("");
  }

  if (typeof vNode === "string" || typeof vNode === "number") {
    return document.createTextNode(String(vNode));
  }

  return null;
}

function createFragmentFromArray(vNodeArray) {
  const fragment = document.createDocumentFragment();
  vNodeArray.forEach((child) => {
    const element = createElement(child);
    if (element) {
      fragment.appendChild(element);
    }
  });
  return fragment;
}

function createElementFromVNode(vNode) {
  if (typeof vNode.type === "function") {
    throw new Error("컴포넌트는 정규화 후 createElement로 생성해야 합니다.");
  }

  const element = document.createElement(vNode.type);

  const eventHandlers = extractEventHandlers(vNode.props);
  if (eventHandlers.length > 0) {
    elementEventHandlers.set(element, eventHandlers);
  }

  updateAttributes(element, vNode.props, null);

  const children = vNode.children || [];
  children.forEach((child) => {
    const childElement = createElement(child);
    if (childElement) {
      element.appendChild(childElement);
    }
  });

  return element;
}

export function createElement(vNode) {
  const textNode = createTextNode(vNode);
  if (textNode) return textNode;

  if (Array.isArray(vNode)) {
    return createFragmentFromArray(vNode);
  }

  if (vNode && typeof vNode === "object" && vNode.type) {
    return createElementFromVNode(vNode);
  }

  return document.createTextNode("");
}
