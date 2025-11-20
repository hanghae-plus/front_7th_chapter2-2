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
      if (
        props[key] === undefined ||
        props[key] === null ||
        props[key] === ""
      ) {
        $el.removeAttribute("class");
        $el.className = "";
      } else {
        $el.className = props[key];
      }
    } else if (key.startsWith("data-")) {
      $el.setAttribute(key, props[key]);
    } else if (key === "checked") {
      $el.checked = props[key] === true;
    } else if (key === "disabled") {
      $el.disabled = props[key] === true;
      if (props[key] === true) {
        $el.setAttribute("disabled", "");
      } else {
        $el.removeAttribute("disabled");
      }
    } else if (key === "selected") {
      $el.selected = props[key] === true;
    } else if (key === "readOnly" || key === "readonly") {
      $el.readOnly = props[key] === true;
      if (props[key] === true) {
        $el.setAttribute("readonly", "");
      } else {
        $el.removeAttribute("readonly");
      }
    } else if (key.startsWith("on")) {
      // 이벤트 핸들러는 나중에 처리
    } else {
      if (
        props[key] === undefined ||
        props[key] === null ||
        props[key] === false
      ) {
        $el.removeAttribute(key);
      } else if (props[key] === true) {
        $el.setAttribute(key, "");
      } else {
        $el.setAttribute(key, props[key]);
      }
    }
  });
}
