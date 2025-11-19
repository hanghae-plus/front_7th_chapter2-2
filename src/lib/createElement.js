import { addEvent } from "./eventManager";

export function createElement(vNode) {
  // 1. vNode가 null, undefined, boolean 일 경우, 빈 텍스트 노드를 반환
  if (
    vNode === null ||
    vNode === undefined ||
    vNode === true ||
    vNode === false
  ) {
    return document.createTextNode("");
  }

  // 2. vNode가 문자열이나 숫자면 텍스트 노드를 생성하여 반환
  if (typeof vNode === "string" || typeof vNode === "number") {
    return document.createTextNode(String(vNode));
  }

  // 3. vNode가 배열이면 DocumentFragment를 생성하고 각 자식에 대해 createElement를 재귀 호출하여 추가
  if (Array.isArray(vNode)) {
    const fragment = document.createDocumentFragment();
    vNode.forEach((child) => {
      fragment.appendChild(createElement(child));
    });
    return fragment;
  }

  // 4-1. vNode.type에 해당하는 요소를 생성
  const element = document.createElement(vNode.type);

  // 4-2.VNode.props의 속성들을 적용
  if (vNode.props) {
    updateAttributes(element, vNode.props);
  }

  // 4-3. VNode.children의 각 자식에 대해서 createElement를 재귀 호출하여 추가
  if (vNode.children && vNode.children.length > 0) {
    vNode.children.forEach((child) => {
      const childElement = createElement(child);
      if (childElement) {
        element.appendChild(childElement);
      }
    });
  }

  updateAttributes(element, vNode.props);
  return element;
}

function updateAttributes($el, props) {
  // prop가 없으면 아무것도 안하고 리턴
  if (!props || typeof props !== "object") {
    return;
  }

  // props의 모든 키를 하나씩 확인
  for (const key in props) {
    const value = props[key];

    // 1. 이벤트 핸들러는 제외 (onClick, onChange 등)
    if (key.startsWith("on") && typeof value === "function") {
      addEvent($el, key.slice(2).toLowerCase(), value);
      continue;
    }

    // 2. className → class 속성으로 변환
    if (key === "className") {
      $el.setAttribute("class", value || "");
      continue;
    }

    // 3. boolean 타입 속성 처리 (checked, disabled, selected 등)
    if (typeof value === "boolean") {
      if (value) {
        // checked와 selected는 property만 설정 (attribute는 설정하지 않음)
        if (key !== "checked" && key !== "selected") {
          $el.setAttribute(key, "");
        }
        $el[key] = true; // property도 설정
      } else {
        $el.removeAttribute(key);
        $el[key] = false; // property도 설정
      }
      continue;
    }

    // 4. data-* 속성은 dataset으로 처리
    if (key.startsWith("data-")) {
      const dataKey = key
        .slice(5)
        .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      $el.dataset[dataKey] = value;
      continue;
    }

    // 5. 일반 속성은 setAttribute로 설정
    if (value === null || value === undefined) {
      $el.removeAttribute(key);
    } else {
      $el.setAttribute(key, value);
    }
  }
}
