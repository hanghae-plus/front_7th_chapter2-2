/**
 * 가상 DOM 노드를 표준화된 형태로 변환하는 함수
 * @param {*} vNode - 정규화할 노드
 * @returns {*} 정규화된 노드
 */
export function normalizeVNode(vNode) {
  // null, undefined, boolean 값은 빈 문자열로 변환
  if (vNode === null || vNode === undefined || typeof vNode === 'boolean') {
    return '';
  }

  // 문자열과 숫자는 문자열로 변환
  if (typeof vNode === 'string' || typeof vNode === 'number') {
    return String(vNode);
  }

  // 함수 컴포넌트인 경우 실행하고 재귀적으로 정규화
  if (typeof vNode.type === 'function') {
    // props에 children 추가
    const propsWithChildren = {
      ...(vNode.props || {}),
      children: vNode.children || [],
    };

    const component = vNode.type(propsWithChildren);
    return normalizeVNode(component);
  }

  // 일반 vNode인 경우 자식들도 재귀적으로 정규화하고 falsy 값 필터링
  if (vNode && typeof vNode === 'object' && vNode.type) {
    return {
      ...vNode,
      children: (vNode.children || [])
        .map((child) => normalizeVNode(child))
        .filter((child) => child !== ''),
    };
  }

  return vNode;
}
