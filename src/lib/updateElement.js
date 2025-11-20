import { addEvent, removeEvent } from "./eventManager";
import { createElement } from "./createElement.js";

const isEventProp = (name) => /^on[A-Z]/.test(name);
const getEventName = (prop) => prop.slice(2).toLowerCase();

const updateStyle = (element, newStyle = {}, oldStyle = {}) => {
  Object.keys(oldStyle || {}).forEach((key) => {
    if (!newStyle || newStyle[key] == null) {
      element.style[key] = "";
    }
  });

  Object.entries(newStyle || {}).forEach(([key, value]) => {
    element.style[key] = value ?? "";
  });
};

const BOOLEAN_NO_ATTR = new Set(["checked", "selected"]);

const setAttribute = (element, name, value) => {
  if (name === "className") {
    element.setAttribute("class", value ?? "");
    return;
  }

  if (name === "htmlFor") {
    element.setAttribute("for", value ?? "");
    return;
  }

  if (name === "style" && value && typeof value === "object") {
    updateStyle(element, value, {});
    return;
  }

  if (typeof value === "boolean") {
    element[name] = value;
    if (BOOLEAN_NO_ATTR.has(name)) {
      if (!value) {
        element.removeAttribute(name);
      } else {
        element.removeAttribute(name);
      }
      return;
    }
    if (value) {
      element.setAttribute(name, "");
    } else {
      element.removeAttribute(name);
    }
    return;
  }

  if (value == null) {
    element.removeAttribute(name);
    return;
  }

  if (name in element) {
    try {
      element[name] = value;
      return;
    } catch {
      // fallthrough
    }
  }

  element.setAttribute(name, value);
};

const removeAttribute = (element, name, oldValue) => {
  if (name === "className") {
    element.removeAttribute("class");
    return;
  }

  if (name === "htmlFor") {
    element.removeAttribute("for");
    return;
  }

  if (name === "style" && oldValue && typeof oldValue === "object") {
    Object.keys(oldValue).forEach((key) => {
      element.style[key] = "";
    });
    return;
  }

  if (typeof oldValue === "boolean") {
    element[name] = false;
    element.removeAttribute(name);
    return;
  }

  element.removeAttribute(name);
};

function updateAttributes(target, originNewProps, originOldProps) {
  const newProps = originNewProps || {};
  const oldProps = originOldProps || {};
  const keys = new Set([
    ...Object.keys(oldProps),
    ...Object.keys(newProps),
  ]);

  keys.forEach((key) => {
    if (key === "children" || key === "key") {
      return;
    }

    const newValue = newProps[key];
    const oldValue = oldProps[key];

    if (isEventProp(key)) {
      const eventType = getEventName(key);

      const hasOld = typeof oldValue === "function";
      const hasNew = typeof newValue === "function";

      if (hasOld && !hasNew) {
        removeEvent(target, eventType, oldValue);
        return;
      }

      if (!hasOld && hasNew) {
        addEvent(target, eventType, newValue);
        return;
      }

      if (hasOld && hasNew && oldValue !== newValue) {
        removeEvent(target, eventType, oldValue);
        addEvent(target, eventType, newValue);
      }
      return;
    }

    if (key === "style" && (typeof newValue === "object" || typeof oldValue === "object")) {
      updateStyle(target, newValue || {}, oldValue || {});
      return;
    }

    if (newValue === oldValue) {
      return;
    }

    if (newValue == null) {
      removeAttribute(target, key, oldValue);
      return;
    }

    setAttribute(target, key, newValue);
  });
}

const isTextNode = (node) =>
  typeof node === "string" || typeof node === "number";

export function updateElement(parentElement, newNode, oldNode, index = 0) {
  const existingDom = parentElement.childNodes[index];

  const removeNode = () => {
    if (existingDom) {
      parentElement.removeChild(existingDom);
    }
  };

  const insertNode = (dom) => {
    const referenceNode = parentElement.childNodes[index] || null;
    parentElement.insertBefore(dom, referenceNode);
  };

  const addNode = () => {
    const newDom = createElement(newNode);
    if (newDom) {
      insertNode(newDom);
    }
  };

  // 1. remove node
  if (newNode == null) {
    removeNode();
    return;
  }

  // 2. add node
  if (oldNode == null) {
    addNode();
    return;
  }

  // 3. text node update
  if (isTextNode(newNode) && isTextNode(oldNode)) {
    if (newNode !== oldNode && existingDom) {
      existingDom.textContent = String(newNode);
    }
    return;
  }

  // 4. replace node when types differ (including text vs element)
  const needsReplace =
    isTextNode(newNode) !== isTextNode(oldNode) ||
    (!isTextNode(newNode) &&
      !isTextNode(oldNode) &&
      newNode.type !== oldNode.type);

  if (needsReplace) {
    const newDom = createElement(newNode);
    if (existingDom && newDom) {
      parentElement.replaceChild(newDom, existingDom);
    } else if (newDom) {
      insertNode(newDom);
    }
    return;
  }

  // 5. same type node update
  if (!existingDom) {
    addNode();
    return;
  }

  updateAttributes(existingDom, newNode.props, oldNode.props);

  const toArray = (children) => {
    if (Array.isArray(children)) return children;
    if (children == null) return [];
    return [children];
  };

  const newChildren = toArray(newNode.children);
  const oldChildren = toArray(oldNode.children);

  const sharedLength = Math.min(newChildren.length, oldChildren.length);

  for (let i = 0; i < sharedLength; i += 1) {
    updateElement(existingDom, newChildren[i], oldChildren[i], i);
  }

  if (newChildren.length > oldChildren.length) {
    for (let i = sharedLength; i < newChildren.length; i += 1) {
      updateElement(existingDom, newChildren[i], null, i);
    }
  } else if (oldChildren.length > newChildren.length) {
    for (let i = oldChildren.length - 1; i >= newChildren.length; i -= 1) {
      updateElement(existingDom, null, oldChildren[i], i);
    }
  }
}
