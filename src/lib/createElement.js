// import { addEvent } from "./eventManager";

export function createElement(vNode) {
  if (vNode === null || vNode === undefined || typeof vNode === "boolean") {
    return document.createTextNode("");
  }

  if (typeof vNode === "string" || typeof vNode === "number") {
    return document.createTextNode(vNode.toString());
  }
  if (Array.isArray(vNode)) {
    const fragment = document.createDocumentFragment();
    vNode.forEach((child) => {
      fragment.appendChild(createElement(child));
    });
    return fragment;
  }

  const $el = document.createElement(vNode.type);

  // props 처리
  if (vNode.props) {
    updateAttributes($el, vNode.props);
  }

  // children 처리
  if (vNode.children && Array.isArray(vNode.children)) {
    vNode.children.forEach((child) => {
      $el.appendChild(createElement(child));
    });
  }

  return $el;
}

function updateAttributes($el, props) {
  Object.keys(props).forEach((key) => {
    if (key === "className") {
      $el.className = props[key];
    } else if (key.startsWith("data-")) {
      $el.setAttribute(key, props[key]);
    } else if (key === "disabled") {
      $el.disabled = props[key];
    } else if (key.startsWith("on")) {
      // 이벤트 핸들러는 나중에 처리
    } else {
      $el.setAttribute(key, props[key]);
    }
  });
}
