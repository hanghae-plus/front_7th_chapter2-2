export function normalizeVNode(vNode) {
  // vNode가 null, undefined 또는 boolean 타입일 경우 빈 문자열을 반환합니다.
  if (vNode === null || vNode === undefined || typeof vNode === "boolean") {
    return "";
  }

  // vNode가 문자열 또는 숫자일 경우 문자열로 변환하여 반환합니다.
  if (typeof vNode === "number") {
    return String(vNode);
  }

  if (typeof vNode === "string") {
    return vNode;
  }
  // vNode의 타입이 함수일 경우 해당 함수를 호출하여 반환된 결과를 재귀적으로 표준화합니다.
  // "재귀적" = 자기 자신을 계속 호출해서 컴포넌트가 더 이상 함수가 아닐 때까지 반복
  if (typeof vNode.type === "function") {
    const result = vNode.type({
      ...(vNode.props || {}),
      children: vNode.children,
    });

    return normalizeVNode(result);
  }

  // 그 외의 경우, vNode의 자식 요소들을 재귀적으로 표준화하고, null 또는 undefined 값을 필터링하여 반환합니다.

  return {
    ...vNode,
    children: (vNode.children || []).map((child) => normalizeVNode(child)).filter((child) => child && child !== ""),
  };
}
