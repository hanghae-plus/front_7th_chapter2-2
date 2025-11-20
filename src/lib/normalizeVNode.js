export function normalizeVNode(vNode) {
  // vNode가 null, undefined 또는 boolean 타입일 경우 빈 문자열을 반환
  if (vNode === null || vNode === undefined || typeof vNode === "boolean") {
    return "";
  }

  // vNode가 문자열 또는 숫자일 경우 문자열로 변환하여 반환
  if (typeof vNode === "string" || typeof vNode === "number") {
    return vNode.toString();
  }

  // vNode의 타입이 함수일 경우 해당 함수를 호출하여 반환된 결과를 재귀적으로 표준화
  // 함수형 컴포넌트일 때 해당 컴포넌트를 실행 해봐야함.
  if (typeof vNode.type === "function") {
    const result = vNode.type({
      ...(vNode.props || {}),
      children: vNode.children,
    });

    return normalizeVNode(result);
  }

  // 그 외의 경우, vNode의 자식 요소들을 재귀적으로 표준화하고, null, undefined, 빈 문자열 값을 필터링하여 반환
  return {
    ...vNode,
    children: vNode.children
      .map(normalizeVNode)
      .filter((child) => child !== "" && child !== null && child !== undefined),
  };
}
