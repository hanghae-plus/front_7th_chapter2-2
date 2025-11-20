export function normalizeVNode(vNode) {
  // vNode가 null | undefined | boolean 타입일 때, 빈 문자열을 반환
  if (vNode === null || vNode === undefined || typeof vNode === "boolean") {
    return "";
  }
  // vNode가 stirng | number일 때, 문자열로 반환
  if (typeof vNode === "string" || typeof vNode === "number") {
    return String(vNode);
  }
  // vNode의 타입이 함수일 때, 재귀적으로 호출하여 정규화
  if (typeof vNode.type === "function") {
    const result = vNode.type({
      ...(vNode.props || {}),
      children: vNode.children,
    });

    return normalizeVNode(result);
  }

  // vNode의 타입이 일반 객체일 때, 자식들을 재귀적으로 정규화
  return {
    ...vNode,
    children: (vNode.children || [])
      .map((child) => normalizeVNode(child))
      .filter((child) => child && child !== ""),
  };
}
