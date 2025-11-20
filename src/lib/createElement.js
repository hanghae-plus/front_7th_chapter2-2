import { addEvent } from "./eventManager";

export function createElement(vNode) {
  // 1. vNode가 null, undefined, boolean 일 경우, 빈 텍스트 노드를 반환합니다.
  if (vNode === null || vNode === undefined || typeof vNode === "boolean") {
    return document.createTextNode("");
  }
  // 2. vNode가 문자열이나 숫자면 텍스트 노드를 생성하여 반환합니다.
  else if (typeof vNode === "string" || typeof vNode === "number") {
    return document.createTextNode(vNode);
  }
  // 3. vNode가 배열이면 DocumentFragment를 생성하고 각 자식에 대해 createElement를 재귀 호출하여 추가합니다.
  else if (Array.isArray(vNode)) {
    const fragment = document.createDocumentFragment();
    vNode.forEach((child) => {
      fragment.appendChild(createElement(child));
    });
    return fragment;
  }
  // 4. 위 경우가 아니면 실제 DOM 요소를 생성합니다:
  //     - vNode.type에 해당하는 요소를 생성
  //     - vNode.props의 속성들을 적용 (이벤트 리스너, className, 일반 속성 등 처리)
  //     - vNode.children의 각 자식에 대해 createElement를 재귀 호출하여 추가
  else {
    const $el = document.createElement(vNode.type);

    // 속성 설정
    updateAttributes($el, vNode.props);

    vNode.children.forEach((child) => {
      $el.appendChild(createElement(child));
    });
    return $el;
  }
}
function updateAttributes($el, props) {
  if (!props) return;

  Object.entries(props)
    .filter(([, value]) => value)
    .forEach(([attr, value]) => {
      // 이벤트 핸들러 처리
      if (attr.startsWith("on")) {
        const eventType = attr.slice(2).toLowerCase(); // "onClick" → "click"
        addEvent($el, eventType, value);
      }
      // className 처리
      else if (attr === "className") {
        $el.className = value;
        $el.setAttribute("class", value);
      }
      // boolean props 처리
      else if (attr === "checked" || attr === "selected") {
        $el[attr] = value;
      } else if (attr === "disabled") {
        $el.disabled = value;
        if (value) {
          $el.setAttribute("disabled", "");
        }
      } else if (attr === "readOnly") {
        $el.readOnly = value;
        if (value) {
          $el.setAttribute("readonly", "");
        }
      }
      // 일반 속성
      else {
        $el.setAttribute(attr, value);
      }
    });
}
