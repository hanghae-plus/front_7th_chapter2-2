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
      const childElement = createElement(child);

      if (childElement) {
        fragment.appendChild(childElement);
      }
    });

    return fragment;
  }

  if (typeof vNode !== "object") {
    return vNode;
  }

  if (vNode.type) {
    const $el = document.createElement(vNode.type);

    if (vNode.props) {
      updateAttributes($el, vNode.props);
    }

    if (vNode.children && vNode.children.length > 0) {
      vNode.children.forEach((child) => {
        const childElement = createElement(child);

        if (childElement) {
          $el.appendChild(childElement);
        }
      });
    }

    return $el;
  }
}

function updateAttributes($el, props) {
  Object.keys(props).forEach((key) => {
    if (key.startsWith("on")) {
      const eventType = key.slice(2).toLowerCase();
      addEvent($el, eventType, props[key]);
    } else if (key === "className") {
      $el.setAttribute("class", props[key]);
    } else if (key === "value") {
      // select, input, textarea 등에서 value 속성은 특별 처리
      if (
        $el.tagName === "SELECT" ||
        $el.tagName === "INPUT" ||
        $el.tagName === "TEXTAREA"
      ) {
        $el.value =
          props[key] !== null && props[key] !== undefined
            ? String(props[key])
            : "";
      } else {
        $el.setAttribute(key, props[key]);
      }
    } else if (key === "checked") {
      // checkbox, radio 등에서 checked 속성은 DOM 속성으로 직접 설정
      if (
        $el.tagName === "INPUT" &&
        ($el.type === "checkbox" || $el.type === "radio")
      ) {
        $el.checked = Boolean(props[key]);
      } else {
        $el.setAttribute(key, props[key]);
      }
    } else if (key === "selected") {
      // option 요소의 selected 속성은 setAttribute로 처리하지 않고, value로 처리
      if ($el.tagName === "OPTION") {
        $el.selected = Boolean(props[key]);
      }
    } else {
      $el.setAttribute(key, props[key]);
    }
  });
}
