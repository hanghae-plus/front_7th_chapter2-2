import { addEvent } from "./eventManager";

// Boolean 속성 목록
const BOOLEAN_PROPS = [
  "checked",
  "selected",
  "disabled",
  "readonly",
  "readOnly",
  "multiple",
  "autofocus",
  "required",
  "autoplay",
  "controls",
  "loop",
  "muted",
  "default",
  "open",
];

/**
 * VNode를 실제 DOM 요소로 변환
 * @param {VNode} vNode - 변환할 VNode
 * @returns {Node} - 생성된 DOM 요소 또는 TextNode
 */
export function createElement(vNode) {
  // Step 1: 원시 값(문자열, 숫자) 처리
  if (typeof vNode === "string" || typeof vNode === "number") {
    return document.createTextNode(vNode);
  }

  // Step 2: null, undefined 처리
  if (vNode == null) {
    return document.createTextNode("");
  }

  // Step 3: 배열 처리 (map으로 각 항목을 createElement 호출)
  if (Array.isArray(vNode)) {
    //fragment 사용 - 노드들을 fragment안에 담아놓고 한번에 dom에 추가하기 위함
    const fragment = document.createDocumentFragment();
    vNode.forEach((node) => {
      fragment.appendChild(createElement(node));
    });
    return fragment;
  }

  // Step 4: 객체(VNode) 처리
  if (typeof vNode === "object") {
    const { type, props, children } = vNode;

    // Step 4-1: 함수형 컴포넌트 처리 - 오류 발생
    // 함수형 컴포넌트는 normalizeVNode로 미리 정규화되어야 함
    if (typeof type === "function") {
      throw new Error(
        `컴포넌트는 반드시 normalizeVNode로 정규화된 후에 createElement를 호출해야 합니다. 받은 컴포넌트: ${type.name}`,
      );
    }

    // Step 4-2: HTML 태그 요소 처리
    if (typeof type === "string") {
      const $el = document.createElement(type);

      // Step 4-3: props 적용 (className, onClick, data-* 등)
      if (props) {
        updateAttributes($el, props);
      }

      // Step 4-4: children 추가
      if (children && children.length > 0) {
        children.forEach((child) => {
          // undefined는 무시
          if (child != null) {
            const childNode = createElement(child);
            if (childNode) {
              $el.appendChild(childNode);
            }
          }
        });
      }

      return $el;
    }
  }

  // 예상 밖의 타입
  return document.createTextNode("");
}

/**
 * DOM 요소에 props(속성)을 적용
 * @param {HTMLElement} $el - 대상 DOM 요소
 * @param {Object} props - 적용할 속성 객체
 */
function updateAttributes($el, props) {
  Object.entries(props).forEach(([key, value]) => {
    // Step 1: 이벤트 핸들러 (onClick, onChange 등)
    if (key.startsWith("on")) {
      const eventType = key.slice(2).toLowerCase(); // onClick -> click
      addEvent($el, eventType, value);
      return;
    }

    // Step 2: 특수 속성 무시
    if (key === "key" || key === "ref" || key === "children") {
      return;
    }

    // Step 3: className → class로 변환
    if (key === "className") {
      $el.setAttribute("class", value);
      return;
    }

    // Step 4: style 처리
    if (key === "style") {
      if (typeof value === "object") {
        // 객체 형태: { color: 'red', fontSize: '16px' }
        Object.entries(value).forEach(([cssKey, cssValue]) => {
          $el.style[cssKey] = cssValue;
        });
      } else if (typeof value === "string") {
        // 문자열 형태: "color: red; font-size: 16px;"
        $el.setAttribute("style", value);
      }
      return;
    }

    // Step 5: data-* 속성
    if (key.startsWith("data-")) {
      $el.setAttribute(key, value);
      return;
    }

    // Step 5.5: Boolean 속성 처리
    const lowerKey = key.toLowerCase();
    if (BOOLEAN_PROPS.includes(key) || BOOLEAN_PROPS.includes(lowerKey)) {
      // property로 직접 설정
      $el[key] = Boolean(value);

      const attrName = key === "readOnly" ? "readonly" : lowerKey;

      // disabled, readonly는 attribute도 설정 (true일 때만)
      if (
        value &&
        (key === "disabled" || key === "readonly" || key === "readOnly")
      ) {
        $el.setAttribute(attrName, "");
      } else {
        // checked, selected는 attribute 설정하지 않음
        // false인 경우도 attribute 제거
        $el.removeAttribute(attrName);
      }
      return;
    }

    // Step 6: 표준 HTML 속성 (id, type, placeholder, disabled 등)
    if (value != null && value !== false) {
      if (value === true) {
        // boolean 속성 (disabled, checked 등)
        $el.setAttribute(key, "");
      } else {
        // 일반 속성
        $el.setAttribute(key, value);
      }
    } else if (value === false) {
      // false인 경우 속성 제거
      $el.removeAttribute(key);
    }
  });
}
