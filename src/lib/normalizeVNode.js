export function normalizeVNode(vNode) {
  // null, undefined, boolean 처리
  if (vNode === null || vNode === undefined || typeof vNode === "boolean") {
    return "";
  }

  // string, number 처리
  if (typeof vNode === "string" || typeof vNode === "number") {
    return String(vNode);
  }

  // 배열 처리
  if (Array.isArray(vNode)) {
    return vNode.map(normalizeVNode).filter((child) => child !== "");
  }

  // vNode가 없거나 type이 없으면 빈 문자열 반환
  if (!vNode || !vNode.type) {
    return "";
  }

  // 함수형 컴포넌트 처리
  if (typeof vNode.type === "function") {
    const component = vNode.type;
    const props = { ...(vNode.props || {}) };

    // children이 있으면 props에 추가
    if (vNode.children && vNode.children.length > 0) {
      // JSX children을 props.children으로 전달
      props.children = vNode.children;
    }

    const result = component(props);
    return normalizeVNode(result);
  }

  // 일반 Element 처리
  if (typeof vNode.type === "string") {
    const children = vNode.children || [];
    const normalizedChildren = children
      .map(normalizeVNode)
      .filter((child) => child !== "");

    return {
      type: vNode.type,
      props: vNode.props || null,
      children: normalizedChildren,
    };
  }

  return vNode;
}
