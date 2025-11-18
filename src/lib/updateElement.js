import { addEvent, removeEvent } from "./eventManager";
import { createElement } from "./createElement.js";

function updateAttributes(target, originNewProps, originOldProps) {
  // 1. newProps를 순회하며 속성 추가/업데이트
  //    - 이벤트 핸들러(onXxx)면 addEvent 사용
  //    - className은 class로 변환
  //    - 일반 속성은 setAttribute
  const newProps = originNewProps || {};
  const oldProps = originOldProps || {};

  // Boolean 속성 목록
  const booleanProps = [
    "checked",
    "disabled",
    "selected",
    "readOnly",
    "required",
  ];

  for (const [key, value] of Object.entries(newProps)) {
    if (key.startsWith("on") && typeof value === "function") {
      const eventType = key.slice(2).toLowerCase();
      addEvent(target, eventType, value);
    } else if (key === "className" || key === "classname") {
      target.setAttribute("class", value);
    } else if (booleanProps.includes(key)) {
      // Boolean 속성은 property로 직접 설정
      target[key] = value;
      // checked와 selected는 DOM attribute에 반영하지 않고, 다른 것들만 반영
      if (key !== "checked" && key !== "selected") {
        if (value) {
          target.setAttribute(
            key === "readOnly" ? "readonly" : key.toLowerCase(),
            "",
          );
        } else {
          target.removeAttribute(
            key === "readOnly" ? "readonly" : key.toLowerCase(),
          );
        }
      }
    } else if (typeof value === "boolean") {
      // 다른 boolean 값들도 처리
      if (value) {
        target.setAttribute(key, "");
      }
    } else if (value != null) {
      target.setAttribute(key, value);
    }
  }

  // 2. oldProps를 순회하며 newProps에 없는 속성 제거
  //    - 이벤트 핸들러면 removeEvent 사용
  //    - 일반 속성은 removeAttribute
  for (const key of Object.keys(oldProps)) {
    if (!(key in newProps)) {
      if (key.startsWith("on") && typeof oldProps[key] === "function") {
        const eventType = key.slice(2).toLowerCase();
        removeEvent(target, eventType);
      } else if (key === "className" || key === "classname") {
        // className은 class 속성으로 제거
        target.removeAttribute("class");
      } else if (booleanProps.includes(key)) {
        // Boolean 속성은 property도 false로 설정하고 attribute 제거
        target[key] = false;
        target.removeAttribute(
          key === "readOnly" ? "readonly" : key.toLowerCase(),
        );
      } else {
        target.removeAttribute(key);
      }
    }
  }
}

export function updateElement(parentElement, newNode, oldNode, index = 0) {
  // 호출: updateElement(container, normalized, container._vNode);
  // parentElement: 부모 DOM 요소
  // newNode: 새로운 vNode (정규화된 상태)
  // oldNode: 이전 vNode (정규화된 상태)
  // index: 자식 배열에서의 인덱스 (기본값 0)

  // 1. oldNode만 있는 경우 (노드 제거)
  //    - parentElement.removeChild(...)로 해당 노드 제거
  if (oldNode && !newNode) {
    const childNode = parentElement.childNodes[index];
    if (childNode) {
      parentElement.removeChild(childNode);
    }
    return;
  }

  // 2. newNode만 있는 경우 (노드 추가)
  //    - createElement(newNode)로 DOM 생성
  //    - parentElement.appendChild(...)로 추가
  if (!oldNode && newNode) {
    const newEl = createElement(newNode);
    parentElement.appendChild(newEl);
    return;
  }

  if (!oldNode && !newNode) {
    return;
  }

  // 3. 둘 다 문자열/숫자인 경우 (텍스트 노드 업데이트)
  //    - 값이 다르면 parentElement.childNodes[index].nodeValue 업데이트
  if (typeof oldNode === "string" || typeof oldNode === "number") {
    if (oldNode !== newNode) {
      const childNode = parentElement.childNodes[index];
      if (childNode) {
        childNode.nodeValue = newNode;
      }
    }
    return;
  }

  // 4. newNode의 type이 변경된 경우 (노드 교체)
  //    - 기존 노드를 새 노드로 교체
  //    - parentElement.replaceChild(새노드, 기존노드)
  if (oldNode.type !== newNode.type) {
    const childNode = parentElement.childNodes[index];
    if (childNode) {
      const newEl = createElement(newNode);
      parentElement.replaceChild(newEl, childNode);
    }
    return;
  }

  // 5. 같은 타입의 요소 노드인 경우 (속성 & 자식 업데이트)
  //    - updateAttributes로 속성 업데이트
  //    - 자식 노드들을 재귀적으로 updateElement 호출
  //      (더 긴 쪽 children 길이만큼 순회하며 각 자식 비교)
  const targetElement = parentElement.childNodes[index];
  updateAttributes(targetElement, newNode.props, oldNode.props);

  const newChildrenLength = newNode.children.length;
  const oldChildrenLength = oldNode.children.length;

  // 자식이 줄어드는 경우 먼저 역순으로 제거 (인덱스 문제 방지)
  for (let i = oldChildrenLength - 1; i >= newChildrenLength; i--) {
    const childToRemove = targetElement.childNodes[i];
    if (childToRemove) {
      targetElement.removeChild(childToRemove);
    }
  }

  // 나머지 자식들 업데이트 또는 추가
  for (let i = 0; i < newChildrenLength; i++) {
    updateElement(targetElement, newNode.children[i], oldNode.children[i], i);
  }
}
