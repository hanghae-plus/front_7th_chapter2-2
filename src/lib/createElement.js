import { addEvent } from "./eventManager";

const isEventProp = (prop) => /^on[A-Z]/.test(prop);

const setStyle = (element, style = {}) => {
  Object.entries(style || {}).forEach(([key, value]) => {
    if (value == null) return;
    element.style[key] = value;
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
    setStyle(element, value);
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
      // fallthrough to setAttribute
    }
  }

  element.setAttribute(name, value);
};

const applyProps = (element, props = {}) => {
  if (!props) return;

  Object.entries(props).forEach(([key, value]) => {
    if (key === "children" || key === "key") {
      return;
    }

    if (isEventProp(key) && typeof value === "function") {
      const eventName = key.slice(2).toLowerCase();
      addEvent(element, eventName, value);
      return;
    }

    setAttribute(element, key, value);
  });
};

const createFragment = (children) => {
  const fragment = document.createDocumentFragment();
  children.flat().forEach((child) => {
    const node = createElement(child);
    if (node) fragment.appendChild(node);
  });
  return fragment;
};

export function createElement(node) {
  if (Array.isArray(node)) {
    return createFragment(node);
  }

  if (node == null || typeof node === "boolean") {
    return document.createTextNode("");
  }

  if (typeof node === "string" || typeof node === "number") {
    return document.createTextNode(String(node));
  }

  if (typeof node !== "object") {
    return document.createTextNode("");
  }

  const { type, props = null, children = [] } = node;

  if (typeof type === "function") {
    throw new Error("Functional components must be normalized before rendering.");
  }

  if (typeof type !== "string") {
    return document.createTextNode("");
  }

  const element = document.createElement(type);
  applyProps(element, props);

  (children || []).forEach((child) => {
    const childNode = createElement(child);
    if (childNode) {
      element.appendChild(childNode);
    }
  });

  return element;
}
