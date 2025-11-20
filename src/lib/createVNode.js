// A Function to create a Virtual DOM Node (VNode)
// type: type of the element (e.g., 'div', 'span', component function, etc)
// VDOM 노드(VNode)를 생성하는 함수
// type: 요소의 타입 (예: 'div', 'span', 컴포넌트 함수 등)

export function createVNode(type, props, ...children) {
  // 자식 배열을 평탄화 처리
  const flattenedChildren = flattenArray(children);

  return {
    type,
    props,
    children: flattenedChildren,
  };
}

/**
 * 배열을 재귀적으로 평탄화하는 헬퍼 함수
 * @param {Array} array - 평탄화할 배열
 * @returns {Array} 평탄화된 배열
 */
function flattenArray(array) {
  const result = [];

  for (const item of array) {
    if (Array.isArray(item)) {
      // if item is an array, recursively flatten it
      result.push(...flattenArray(item));
    } else if (item !== null && item !== undefined && item !== false) {
      // exclude null, undefined, and false values
      result.push(item);
    }
  }

  return result;
}
