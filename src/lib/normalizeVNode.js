export function normalizeVNode(vNode) {
  // 1. null, undefined, boolean 타입일 경우 빈 문자열 반환
  if (vNode == null || typeof vNode === "boolean") {
    return "";
  }

  // 2. 문자열 또는 숫자일 경우 문자열로 변환
  if (typeof vNode === "string" || typeof vNode === "number") {
    return String(vNode);
  }

  // 3. vNode의 타입이 함수일 경우 (함수형 컴포넌트)
  if (typeof vNode.type === "function") {
    // 함수를 호출하여 결과를 재귀적으로 정규화
    // props가 null일 경우 빈 객체를 전달하고, children도 props에 포함
    const props = vNode.props || {};
    const propsWithChildren = {
      ...props,
      children:
        vNode.children.length === 1 ? vNode.children[0] : vNode.children,
    };
    return normalizeVNode(vNode.type(propsWithChildren));
  }

  // 4. 그 외의 경우 (일반 vNode 객체)
  // 자식 요소들을 재귀적으로 정규화하고, null/undefined/빈 문자열 필터링
  return {
    ...vNode,
    children: vNode.children
      .map((child) => normalizeVNode(child))
      .filter((child) => child !== "" && child !== null && child !== undefined),
  };
}
