import { addEvent } from "./eventManager";

export function createElement(vNode) {
  // vNode가 null, undefined, boolean 일 경우, 빈 텍스트 노드를 반환
  if (vNode === null || vNode === undefined || typeof vNode === "boolean") {
    return document.createTextNode("");
  }

  // vNode가 문자열이나 숫자면 텍스트 노드를 생성하여 반환
  if (typeof vNode === "string" || typeof vNode === "number") {
    return document.createTextNode(vNode.toString());
  }

  // vNode가 배열이면 DocumentFragment를 생성하고 각 요소에 대해 createElement를 재귀 호출하여 추가
  if (Array.isArray(vNode)) {
    const fragment = document.createDocumentFragment();
    vNode.forEach((node) => fragment.appendChild(createElement(node)));
    return fragment;
  }

  // 위 경우가 아니면 실제 DOM 요소를 생성

  // vNode.type에 해당하는 요소를 생성
  const element = document.createElement(vNode.type);

  // vNode.props의 속성들을 적용 (이벤트 리스너, className, 일반 속성 등 처리)
  updateAttributes(element, vNode.props || {});

  // vNode.children의 각 자식에 대해 createElement를 재귀 호출하여 추가
  (vNode.children || []).forEach((child) =>
    element.appendChild(createElement(child)),
  );
  return element;
}

function updateAttributes($el, props) {
  Object.entries(props).forEach(([key, value]) => {
    // 이벤트 등록
    if (key.startsWith("on")) {
      const eventType = key.slice(2).toLowerCase(); // onClick → click
      addEvent($el, eventType, value);
      return;
    }

    // className → class로 변환
    if (key === "className") {
      $el.setAttribute("class", value);
      return;
    }

    // boolean props (checked, disabled, selected, readOnly 등)
    if (
      key === "checked" ||
      key === "disabled" ||
      key === "selected" ||
      key === "readOnly"
    ) {
      $el[key] = value;
      return;
    }

    // 일반 속성 처리
    return $el.setAttribute(key, value);
  });
}
