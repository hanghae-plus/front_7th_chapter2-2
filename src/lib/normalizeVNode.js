export function normalizeVNode(vNode) {
  console.log(vNode);

  // 1. vNode가 null, undefined 또는 boolean 타입일 경우 빈 문자열을 반환합니다.
  // 2. vNode가 문자열 또는 숫자일 경우 문자열로 변환하여 반환합니다.
  // 3. vNode의 타입이 함수일 경우 해당 함수를 호출하여 반환된 결과를 재귀적으로 표준화합니다.
  // 4. 그 외의 경우, vNode의 자식 요소들을 재귀적으로 표준화하고, null 또는 undefined 값을 필터링하여 반환합니다.

  if (vNode === null || vNode === undefined || typeof vNode === "boolean") {
    return "";
  }

  if (typeof vNode === "string" || typeof vNode === "number") {
    return String(vNode);
  }

  if (typeof vNode === "function") {
    return normalizeVNode(vNode());
  }

  if (typeof vNode.type === "function") {
    return normalizeVNode(
      vNode.type({
        ...(vNode.props || {}),
        children: vNode.children,
      }),
    );
  }

  const normalizedChildren = (vNode.children || [])
    .map((child) => normalizeVNode(child))
    .filter(
      (child) =>
        child != null && child !== false && child !== true && child !== "",
    );

  return {
    type: vNode.type,
    props: vNode.props,
    children: normalizedChildren,
  };
}
