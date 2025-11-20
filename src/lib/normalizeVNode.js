export function normalizeVNode(vNode) {
  if (vNode === null || vNode === undefined || typeof vNode === "boolean") {
    return "";
  }

  if (typeof vNode === "string" || typeof vNode === "number") {
    return vNode.toString();
  }

  // vNode가 객체인 경우 (가상 DOM 노드)
  if (vNode && typeof vNode === "object" && vNode.type) {
    // 함수형 컴포넌트인 경우 실행
    if (typeof vNode.type === "function") {
      const props = vNode.props || {};
      // children을 props에 포함시켜야 함
      const componentProps = {
        ...props,
        children: vNode.children || [],
      };
      const componentResult = vNode.type(componentProps);
      return normalizeVNode(componentResult);
    }

    // 일반 엘리먼트인 경우 자식들을 재귀적으로 정규화
    const normalizedChildren = (vNode.children || [])
      .map((child) => normalizeVNode(child))
      .filter(
        (child) =>
          child !== null &&
          child !== undefined &&
          child !== "" &&
          typeof child !== "boolean",
      );

    return {
      type: vNode.type,
      props: vNode.props,
      children: normalizedChildren,
    };
  }

  return vNode;
}
