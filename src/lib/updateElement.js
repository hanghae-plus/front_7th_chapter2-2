import { createElement } from "./createElement.js";
import { updateAttributes } from "./updateAttributes.js";
import { updateChildren } from "./updateChildren.js";

// 이전 가상 DOM과 새 가상 DOM을 비교해서 최소한의 변경만 실제 DOM에 적용
// 예시:
// 이전: <div>Hello</div>
// 새로: <div>Bye</div>
// → 텍스트만 "Hello" → "Bye"로 변경

export function updateElement(parentElement, newNode, oldNode, index = 0) {
  // DOM 접근 최적화: childNodes[index]를 한 번만 접근
  const targetNode = parentElement.childNodes[index];

  // 1. 노드 삭제: oldNode는 있는데 newNode가 없음
  if (!newNode && oldNode) {
    return parentElement.removeChild(targetNode);
  }

  // 2. 노드 추가: newNode는 있는데 oldNode가 없음
  if (newNode && !oldNode) {
    return parentElement.appendChild(createElement(newNode));
  }

  // 3. 텍스트 노드 변경: 둘 다 문자열/숫자
  const newIsText = typeof newNode === "string" || typeof newNode === "number";
  const oldIsText = typeof oldNode === "string" || typeof oldNode === "number";

  if (newIsText && oldIsText) {
    if (newNode !== oldNode) {
      // 텍스트 내용이 다르면 변경
      targetNode.textContent = newNode;
    }
    return;
  }

  // 4. 타입 변경: div → span 등 (전체 교체)
  if (newNode.type !== oldNode.type) {
    return parentElement.replaceChild(createElement(newNode), targetNode);
  }

  // 5. 같은 타입: 속성 업데이트 + children 재귀
  // 속성 업데이트
  updateAttributes(targetNode, newNode.props || {}, oldNode.props || {});

  // Children 재귀적으로 업데이트
  const newChildren = newNode.children || [];
  const oldChildren = oldNode.children || [];

  // updateChildren 함수에 updateElement를 전달 (재귀 호출을 위해)
  updateChildren(targetNode, newChildren, oldChildren, updateElement);
}
