export function normalizeVNode(vNode) {
  // 1. 최상위 레벨에서 직접 호출된 경우: null, undefined, boolean을 빈 문자열로 변환 (첫 번째 테스트 케이스 충족)
  if (vNode === null || vNode === undefined || typeof vNode === "boolean") {
    return "";
  }

  // 2. 숫자나 문자열은 텍스트 노드로 변환
  if (typeof vNode === "string" || typeof vNode === "number") {
    return String(vNode);
  }

  // 3. vNode가 배열인 경우, 각 항목을 정규화
  if (Array.isArray(vNode)) {
    return vNode.map(normalizeVNode).flat();
  }

  // vNode 객체가 아니면 그대로 반환
  if (!vNode || !vNode.type) {
    return vNode;
  }

  // 4. 함수형 컴포넌트 처리
  if (typeof vNode.type === "function") {
    const props = { ...(vNode.props || {}), children: vNode.children };
    const renderedVNode = vNode.type(props);
    return normalizeVNode(renderedVNode);
  }

  // 5. 네이티브 엘리먼트 처리 (e.g. type: 'div')
  // 여기서 두 번째 테스트 케이스를 충족시킵니다.
  const normalizedChildren = vNode.children
    .flat()
    // 먼저 Falsy 값들을 자식 배열에서 완전히 제거합니다.
    .filter(
      (child) =>
        child !== null && child !== undefined && typeof child !== "boolean",
    )
    // 그 후에 남은 유효한 자식들만 재귀적으로 정규화합니다.
    .map(normalizeVNode);

  return {
    ...vNode,
    children: normalizedChildren,
  };
}
