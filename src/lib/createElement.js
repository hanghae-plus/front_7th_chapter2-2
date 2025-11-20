import { addEvent } from "./eventManager";

export function createElement(vNode) {
  if (typeof vNode === "string") return document.createTextNode(vNode);
  if (typeof vNode === "number") return document.createTextNode(String(vNode));
  if (typeof vNode === "boolean") return document.createTextNode(""); // boolean 속성 조정 필요
  if (typeof vNode === "undefined") return document.createTextNode("");

  if (typeof vNode === "object") {
    if (vNode === null) return document.createTextNode("");

    if (Array.isArray(vNode)) {
      const fragment = document.createDocumentFragment();
      vNode.forEach((child) => {
        fragment.appendChild(createElement(child));
      });
      return fragment;
    }

    if (typeof vNode.type === "function")
      throw new Error("컴포넌트는 createElement로 처리할 수 없다.");

    const $el = document.createElement(vNode.type);

    updateAttributes($el, vNode.props);

    vNode.children.forEach((child) => {
      $el.appendChild(createElement(child));
    });

    return $el;
  }
}

function updateAttributes($el, props) {
  if (!props) return;

  const BOOLEAN_ATTRS = ["checked", "disabled", "selected", "readOnly"];

  Object.entries(props).forEach(([key, value]) => {
    // 이벤트 핸들러 처리
    if (key.startsWith("on") && typeof value === "function") {
      const eventType = key.slice(2).toLowerCase(); // onClick -> click
      addEvent($el, eventType, value);
      return;
    }

    if (key === "className") {
      $el.className = value;
    } else if (key === "style") {
      $el.style.cssText = Object.entries(value)
        .map(([key, value]) => `${key}: ${value}`)
        .join(";");
    } else if (BOOLEAN_ATTRS.includes(key)) {
      $el[key] = Boolean(value);
    } else {
      $el.setAttribute(key, value);
    }
  });
}
