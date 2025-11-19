import { addEvent } from "./eventManager";

export function createElement(vNode) {
  // 1. vNode가 null, undefined, boolean, 빈 문자열일 경우 빈 텍스트 노드 반환
  if (vNode == null || typeof vNode === "boolean" || vNode === "") {
    return document.createTextNode("");
  }

  // 2. vNode가 문자열이나 숫자면 텍스트 노드 생성
  if (typeof vNode === "string" || typeof vNode === "number") {
    return document.createTextNode(String(vNode));
  }

  // 3. vNode가 배열이면 DocumentFragment 생성
  if (Array.isArray(vNode)) {
    const fragment = document.createDocumentFragment();
    vNode.forEach((child) => {
      const childEl = createElement(child);
      if (childEl) {
        fragment.appendChild(childEl);
      }
    });
    return fragment;
  }

  // 4. vNode 객체가 아니거나 type이 없으면 빈 텍스트 노드 반환
  if (!vNode || typeof vNode !== "object" || !vNode.type) {
    return document.createTextNode("");
  }

  // 5. 함수형 컴포넌트인 경우 에러 발생
  if (typeof vNode.type === "function") {
    throw new Error(
      "함수형 컴포넌트는 normalizeVNode로 정규화한 후 createElement를 호출해야 합니다.",
    );
  }

  // 6. 실제 DOM 요소 생성
  const $el = document.createElement(vNode.type);

  // 7. 속성 적용
  if (vNode.props) {
    updateAttributes($el, vNode.props);
  }

  // 8. 자식 요소 추가
  if (vNode.children && Array.isArray(vNode.children)) {
    vNode.children.forEach((child) => {
      const childElement = createElement(child);
      if (
        childElement &&
        (childElement.nodeType !== Node.TEXT_NODE ||
          childElement.textContent !== "")
      ) {
        $el.appendChild(childElement);
      }
    });
  }

  return $el;
}

function updateAttributes($el, props) {
  Object.entries(props).forEach(([key, value]) => {
    // 이벤트 리스너 처리 (onClick, onInput 등)
    if (key.startsWith("on") && typeof value === "function") {
      const eventType = key.slice(2).toLowerCase(); // onClick -> click
      addEvent($el, eventType, value);
    }
    // className 처리
    else if (key === "className") {
      if (value) {
        $el.setAttribute("class", value);
      }
    }
    // boolean 속성 처리 (checked, disabled, selected 등)
    else if (typeof value === "boolean") {
      // property로 직접 설정
      $el[key] = value;

      // disabled만 DOM attribute로도 관리, 나머지는 property만
      if (key === "disabled") {
        if (value) {
          $el.setAttribute(key, "");
        } else {
          $el.removeAttribute(key);
        }
      }
    }
    // 일반 속성 처리
    else if (value != null) {
      $el.setAttribute(key, value);
    }
  });
}
