export function normalizeVNode(vNode) {
  // 1. null, undefined, boolean → 빈 문자열
  if (
    vNode === null ||
    vNode === undefined ||
    vNode === true ||
    vNode === false
  ) {
    return "";
  }

  // 2. 숫자 → 문자열로 변환
  if (typeof vNode === "number") {
    return String(vNode);
  }

  // 3. 문자열 → 그대로 반환
  if (typeof vNode === "string") {
    return vNode;
  }

  // 4. vNode 객체 처리
  if (typeof vNode === "object" && vNode !== null) {
    // 4-1. 함수형 컴포넌트인 경우 (type이 함수)
    if (typeof vNode.type === "function") {
      // 함수를 실행해서 결과를 정규화
      const props = vNode.props || {};
      const children = vNode.children || [];
      const componentProps = { ...props, children };
      const result = vNode.type(componentProps);
      return normalizeVNode(result);
    }

    // 4-2. 일반 vNode인 경우
    // children을 재귀적으로 정규화하고 falsy 값 제거
    const normalizedChildren = (vNode.children || [])
      .map((child) => normalizeVNode(child))
      .filter((child) => {
        // 빈 문자열이 아닌 것만 유지
        return (
          child !== "" &&
          child !== null &&
          child !== undefined &&
          child !== false
        );
      });

    return {
      ...vNode,
      children: normalizedChildren,
    };
  }
  return vNode;
}
