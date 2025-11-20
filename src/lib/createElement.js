import { addEvent } from "./eventManager";

export function createElement(vNode) {
  // null, undefined, true, false는 빈 텍스트 노드로 변환
  if (
    vNode === null ||
    vNode === undefined ||
    vNode === true ||
    vNode === false
  ) {
    return document.createTextNode("");
  }

  // 문자열과 숫자는 텍스트 노드로 변환
  if (typeof vNode === "string" || typeof vNode === "number") {
    return document.createTextNode(String(vNode));
  }

  // 배열은 DocumentFragment로 변환
  if (Array.isArray(vNode)) {
    const fragment = document.createDocumentFragment();
    vNode.forEach((child) => {
      const element = createElement(child);
      if (element) {
        fragment.appendChild(element);
      }
    });
    return fragment;
  }

  // VNode 객체인지 확인
  if (typeof vNode === "object" && vNode !== null && "type" in vNode) {
    const { type, props, children } = vNode;

    // type이 함수면 에러 발생
    if (typeof type === "function") {
      throw new Error("Component must be normalized before creating element");
    }

    // DOM 요소 생성
    const element = document.createElement(type);

    // 속성 설정
    if (props) {
      updateAttributes(element, props);
    }

    // 자식 요소 처리
    if (children && Array.isArray(children)) {
      children.forEach((child) => {
        if (child !== null && child !== undefined) {
          const childElement = createElement(child);
          if (childElement) {
            element.appendChild(childElement);
          }
        }
      });
    }

    return element;
  }

  // 그 외의 경우는 null 반환
  return null;
}

function updateAttributes($el, props) {
  if (!props) return;

  Object.keys(props).forEach((key) => {
    const value = props[key];

    // 이벤트 핸들러 처리 (onClick, onMouseOver 등)
    if (key.startsWith("on") && typeof value === "function") {
      const eventType = key.slice(2).toLowerCase(); // onClick -> click
      addEvent($el, eventType, value);
      return;
    }

    // className을 class로 변환
    if (key === "className") {
      $el.setAttribute("class", value || "");
      return;
    }

    // 불리언 속성 처리
    if (typeof value === "boolean") {
      if (value) {
        $el.setAttribute(key, "");
        // DOM 속성도 설정 (disabled, checked 등)
        if (key in $el) {
          $el[key] = true;
        }
      } else {
        $el.removeAttribute(key);
        if (key in $el) {
          $el[key] = false;
        }
      }
      return;
    }

    // data-* 속성은 dataset으로 처리
    if (key.startsWith("data-")) {
      const dataKey = key
        .slice(5)
        .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      $el.dataset[dataKey] = value;
      return;
    }

    // 일반 속성 설정
    if (value !== null && value !== undefined) {
      $el.setAttribute(key, value);
      // DOM 속성도 설정 (id, href 등)
      if (key in $el) {
        $el[key] = value;
      }
    }
  });
}
