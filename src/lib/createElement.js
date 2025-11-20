import { addEvent } from "./eventManager";
import { normalizeVNode } from "./normalizeVNode";

export function createElement(vNode) {
  // virual dom 만들기
  if (vNode === undefined || vNode === null || typeof vNode === "boolean") {
    return document.createTextNode("");
  }
  if (typeof vNode === "string" || typeof vNode === "number") {
    return document.createTextNode(vNode.toString());
  }
  if (typeof vNode === "object") {
    // 객체일때 재귀적으로 처리해야함
    if (typeof vNode.type === "function") throw new Error("error");
    if (typeof vNode.type === "string") {
      const $el = document.createElement(vNode.type);
      updateAttributes($el, vNode.props ?? {});
      normalizeVNode(vNode.children ?? []).forEach((child) => {
        $el.appendChild(createElement(child));
      });
      return $el;
    }
    if (Array.isArray(vNode)) {
      const fragment = document.createDocumentFragment();
      vNode.forEach((child) => {
        fragment.appendChild(createElement(normalizeVNode(child)));
      });
      return fragment;
    }
  }

  function updateAttributes($el, props) {
    // 이벤트, 속성 업데이트
    Object.entries(props).forEach(([key, value]) => {
      if (key.startsWith("on") && typeof value === "function") {
        addEvent($el, key.slice(2).toLowerCase(), value);
        return;
      }

      if (value === undefined || value === null) {
        $el.removeAttribute(key === "className" ? "class" : key);
        if (key in $el) {
          $el[key] = typeof $el[key] === "boolean" ? false : "";
        }
        return;
      }

      if (key === "className") {
        $el.setAttribute("class", value);
        return;
      }

      if (typeof value === "boolean") {
        // boolean type 속성일 때 추가해줘야함
        $el[key] = value;
        value ? $el.setAttribute(key, "") : $el.removeAttribute(key);
        return;
      }

      if (key.startsWith("data-")) {
        $el.setAttribute(key, value);
        return;
      }

      $el.setAttribute(key, value);
    });
  }
}
