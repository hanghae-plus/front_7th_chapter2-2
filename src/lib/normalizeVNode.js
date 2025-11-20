export function normalizeVNode(vNode) {
  console.log(vNode);
  // null, undefined, boolean 값은 빈 문자열로 변환
  if (
    vNode === null ||
    vNode === undefined ||
    vNode === true ||
    vNode === false
  ) {
    return '';
  }

  // 문자열과 숫자는 문자열로 변환
  if (typeof vNode === 'string' || typeof vNode === 'number') {
    return String(vNode);
  }

  // 컴포넌트 정규화
  // 받은 값이 컴포넌트면, 실행해서 재귀해서 정규화한 값을 반환한다.
  // { type: [Function: TestComponent], props: null, children: [] }
  if (typeof vNode.type === 'function') {
    return normalizeVNode(
      vNode.type({ ...vNode.props, children: vNode.children })
    );
  }
  if (typeof vNode.type === 'string') {
    // children 배열을 정규화하고 빈 문자열 제거
    const normalizedChildren = vNode.children
      .map((child) => normalizeVNode(child))
      .filter((child) => child !== '');

    return {
      ...vNode,
      children: normalizedChildren
    };
  }

  //"Falsy 값 (null, undefined, false)은 자식 노드에서 제거되어야 한다."
  const flatFilterChildren = vNode.children
    .flat(Infinity)
    .filter(
      (child) =>
        child !== null &&
        child !== undefined &&
        child !== false &&
        child !== true
    );
  return { ...vNode, children: flatFilterChildren };
}
