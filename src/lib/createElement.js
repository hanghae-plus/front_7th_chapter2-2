import { addEvent } from "./eventManager";

export function createElement(vNode) {
  // 1. vNode가 null, undefined, boolean 일 경우, 빈 텍스트 노드를 반환합니다.
  if (vNode == null || typeof vNode === "boolean") {
    return document.createTextNode("");
  }

  // 2. vNode가 문자열이나 숫자면 텍스트 노드를 생성하여 반환합니다.
  if (typeof vNode === "string" || typeof vNode === "number") {
    return document.createTextNode(String(vNode));
  }

  // 3. vNode가 배열이면 DocumentFragment를 생성하고 각 자식에 대해 createElement를 재귀 호출하여 추가합니다.
  if (Array.isArray(vNode)) {
    const fragment = document.createDocumentFragment();
    vNode.forEach((child) => {
      fragment.appendChild(createElement(child));
    });
    return fragment;
  }

  // 4. vNode.type이 함수인 경우 에러를 발생시킵니다 (정규화가 필요함)
  if (typeof vNode.type === "function") {
    throw new Error(
      "Function components must be normalized before creating elements",
    );
  }

  // 5. 실제 DOM 요소를 생성합니다.
  const $el = document.createElement(vNode.type);

  // 6. vNode.props의 속성들을 적용
  updateAttributes($el, vNode.props);

  // 7. vNode.children의 각 자식에 대해 createElement를 재귀 호출하여 추가
  if (vNode.children) {
    vNode.children.forEach((child) => {
      // null, undefined, boolean은 건너뜀
      if (child == null || typeof child === "boolean") {
        return;
      }
      $el.appendChild(createElement(child));
    });
  }

  return $el;
}

// Boolean 속성 목록 (property만 사용)
const PROPERTY_ONLY_BOOLEAN_PROPS = ["checked", "selected"];

// Boolean 속성 목록 (property + attribute 모두 사용)
const BOOLEAN_PROPS = ["disabled", "readOnly", "multiple", "isMap"];

function updateAttributes($el, props) {
  if (!props) return;

  Object.entries(props).forEach(([key, value]) => {
    // 이벤트 리스너 처리 (onClick, onMouseOver 등)
    if (key.startsWith("on") && typeof value === "function") {
      const eventType = key.slice(2).toLowerCase();
      addEvent($el, eventType, value);
    }
    // className 처리
    else if (key === "className") {
      $el.setAttribute("class", value);
    }
    // Property만 사용하는 Boolean 속성 (checked, selected)
    else if (PROPERTY_ONLY_BOOLEAN_PROPS.includes(key)) {
      $el[key] = value;
      // DOM attribute는 설정하지 않음
    }
    // Property + Attribute 사용하는 Boolean 속성 (disabled 등)
    else if (BOOLEAN_PROPS.includes(key)) {
      $el[key] = value;
      if (value) {
        $el.setAttribute(key, "");
      } else {
        $el.removeAttribute(key);
      }
    }
    // 일반 속성 처리
    else {
      $el.setAttribute(key, value);
    }
  });
}
