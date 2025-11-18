import { addEvent } from "./eventManager";

export function createElement(vNode) {
  if (vNode === null || vNode === undefined || typeof vNode === "boolean") {
    return document.createTextNode("");
  }

  if (typeof vNode === "string" || typeof vNode === "number") {
    return document.createTextNode(String(vNode));
  }

  if (Array.isArray(vNode)) {
    const fragment = document.createDocumentFragment();
    vNode.forEach((child) => {
      fragment.appendChild(createElement(child));
    });
    return fragment;
  }

  if (typeof vNode.type === "function") {
    throw new Error(
      "컴포넌트를 createElement로 직접 생성할 수 없습니다. normalizeVNode를 먼저 호출하세요.",
    );
  }

  if (typeof vNode.type === "string") {
    const $el = document.createElement(vNode.type);

    updateAttributes($el, vNode.props || {});

    if (vNode.children) {
      vNode.children.forEach((child) => {
        $el.appendChild(createElement(child));
      });
    }

    return $el;
  }

  return document.createTextNode("");
}

function updateAttributes($el, props) {
  Object.entries(props).forEach(([key, value]) => {
    if (key === "className") {
      $el.setAttribute("class", value);
      return;
    }

    if (key.startsWith("on") && typeof value === "function") {
      const eventType = key.slice(2).toLowerCase();
      addEvent($el, eventType, value);
      return;
    }

    if (typeof value === "boolean") {
      if (value) {
        $el.setAttribute(key, "");
      }
      return;
    }

    if (value !== null && value !== undefined) {
      $el.setAttribute(key, value);
    }
  });
}
