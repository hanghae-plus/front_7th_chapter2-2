import { removeEvent } from "./eventManager";
import {
  createElement,
  getElementEventHandlers,
  elementEventHandlers,
} from "./createElement.js";
import { updateAttributes, extractEventHandlers } from "./attributeUtils.js";

function insertElement(parentElement, element, index) {
  if (element.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    while (element.firstChild) {
      if (index < parentElement.childNodes.length) {
        parentElement.insertBefore(
          element.firstChild,
          parentElement.childNodes[index],
        );
      } else {
        parentElement.appendChild(element.firstChild);
      }
      index++;
    }
  } else {
    if (index < parentElement.childNodes.length) {
      parentElement.insertBefore(element, parentElement.childNodes[index]);
    } else {
      parentElement.appendChild(element);
    }
  }
}

function addNewNode(parentElement, newNode, index) {
  const element = createElement(newNode);
  if (element) {
    insertElement(parentElement, element, index);
  }
}

function removeOldNode(parentElement, index) {
  if (index < parentElement.childNodes.length) {
    parentElement.removeChild(parentElement.childNodes[index]);
  }
}

function replaceNode(parentElement, newNode, index) {
  const newElement = createElement(newNode);
  if (newElement && index < parentElement.childNodes.length) {
    parentElement.replaceChild(newElement, parentElement.childNodes[index]);
  }
}

function updateTextNode(currentElement, newNode) {
  if (typeof newNode === "string" || typeof newNode === "number") {
    currentElement.textContent = String(newNode);
  }
}

function updateEventHandlers(element, newProps) {
  const oldEventHandlers = getElementEventHandlers(element);
  oldEventHandlers.forEach(({ eventType, handler }) => {
    removeEvent(element, eventType, handler);
  });

  const newEventHandlers = extractEventHandlers(newProps);
  if (newEventHandlers.length > 0) {
    elementEventHandlers.set(element, newEventHandlers);
  } else {
    elementEventHandlers.delete(element);
  }
}

function updateElementNode(currentElement, newNode, oldNode) {
  updateEventHandlers(currentElement, newNode.props);
  updateAttributes(currentElement, newNode.props, oldNode.props);

  const newChildren = newNode.children || [];
  const oldChildren = oldNode.children || [];
  const maxLength = Math.max(newChildren.length, oldChildren.length);

  for (let i = 0; i < maxLength; i++) {
    updateElement(currentElement, newChildren[i], oldChildren[i], i);
  }

  while (currentElement.childNodes.length > newChildren.length) {
    currentElement.removeChild(currentElement.lastChild);
  }
}

export function updateElement(parentElement, newNode, oldNode, index = 0) {
  if (!newNode && !oldNode) return;

  if (!oldNode && newNode) {
    addNewNode(parentElement, newNode, index);
    return;
  }

  if (oldNode && !newNode) {
    removeOldNode(parentElement, index);
    return;
  }

  if (newNode.type !== oldNode.type) {
    replaceNode(parentElement, newNode, index);
    return;
  }

  if (index >= parentElement.childNodes.length) return;

  const currentElement = parentElement.childNodes[index];

  if (currentElement.nodeType === Node.TEXT_NODE) {
    updateTextNode(currentElement, newNode);
    return;
  }

  if (currentElement.nodeType === Node.ELEMENT_NODE) {
    updateElementNode(currentElement, newNode, oldNode);
  }
}
