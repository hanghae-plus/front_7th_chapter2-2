import { addEvent } from "./eventManager";

export function createElement(vNode) {
  if (vNode === undefined || vNode === null || typeof vNode === "boolean") {
    return document.createTextNode("");
  }

  if (typeof vNode === "string" || typeof vNode === "number") {
    return document.createTextNode(String(vNode));
  }

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

  if (typeof vNode === "object" && vNode !== null) {
    // 함수 컴포넌트는 정규화 후에만 createElement 호출되므로 여기서는 처리하지 않음
    if (typeof vNode.type === "function") {
      throw new Error("함수 컴포넌트는 정규화 후에 createElement를 호출해야 합니다.");
    }

    // DOM 요소 생성
    const $el = document.createElement(vNode.type);

    // props 적용
    if (vNode.props) {
      updateAttributes($el, vNode.props);
    }

    // children 처리 및 추가
    if (vNode.children) {
      vNode.children.forEach((child) => {
        const childElement = createElement(child);
        if (childElement) {
          // DocumentFragment인 경우 자식 노드들을 추가
          if (childElement.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            while (childElement.firstChild) {
              $el.appendChild(childElement.firstChild);
            }
          } else {
            $el.appendChild(childElement);
          }
        }
      });
    }

    return $el;
  }
}

function updateAttributes($el, props) {
  if (!props) return;

  Object.keys(props).forEach((key) => {
    if (key === "children") return; // children는 별도 처리

    // 이벤트 핸들러 처리 (onClick, onMouseOver 등)
    if (key.startsWith("on") && typeof props[key] === "function") {
      const eventType = key.slice(2).toLowerCase(); // onClick -> click
      addEvent($el, eventType, props[key]);
      return;
    }

    // className을 class로 변환
    if (key === "className") {
      $el.setAttribute("class", props[key]);
    } else if (typeof props[key] === "boolean") {
      // 불리언 속성 처리
      if (props[key]) {
        $el.setAttribute(key, "");
      } else {
        $el.removeAttribute(key);
      }
    } else {
      $el.setAttribute(key, props[key]);
    }
  });
}
