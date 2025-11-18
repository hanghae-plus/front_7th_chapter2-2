import { addEvent } from "./eventManager";

export function createElement(vNode) {
  // 1. null, undefined, boolean을 빈 텍스트 노드로 변환
  if (vNode == null || typeof vNode === "boolean") {
    return document.createTextNode("");
  }

  // 2. 문자열이나 숫자는 텍스트 노드로 변환
  if (typeof vNode === "string" || typeof vNode === "number") {
    return document.createTextNode(String(vNode));
  }

  // 3. 배열이면 DocumentFragment 생성
  if (Array.isArray(vNode)) {
    const fragment = document.createDocumentFragment();
    vNode.forEach((child) => {
      fragment.appendChild(createElement(child));
    });
    return fragment;
  }

  if (typeof vNode.type === "function") {
    throw new Error(
      "Function components must be normalized before createElement",
    );
  }

  // 4-2. 일반 DOM 요소 생성
  const $el = document.createElement(vNode.type);

  const { props, children } = vNode;

  if (props) {
    Object.entries(props).forEach(([key, value]) => {
      if (key.startsWith("on") && typeof value === "function") {
        const eventType = key.slice(2).toLowerCase(); // onClick -> click
        addEvent($el, eventType, value);
      } else {
        if (key === "className" || key === "classname") {
          $el.setAttribute("class", value);
        } else if (typeof value === "boolean") {
          if (value) {
            $el.setAttribute(key, "");
          }
        } else if (value != null) {
          $el.setAttribute(key, value);
        }
      }
    });
  }

  children.forEach((child) => {
    $el.appendChild(createElement(child));
  });

  return $el;
}
