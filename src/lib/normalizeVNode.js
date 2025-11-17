export function normalizeVNode(vNode) {
  if (vNode === null || vNode === undefined || typeof vNode === "boolean") {
    return "";
  }

  if (typeof vNode === "string" || typeof vNode === "number") {
    return String(vNode);
  }

  // 재귀로 자식 노드들을 정규화
  if (Array.isArray(vNode)) {
    return vNode.map(normalizeVNode).filter((child) => child !== "");
  }

  if (typeof vNode.type === "function") {
    const component = vNode.type;
    const props = { ...vNode.props, children: vNode.children };
    const result = component(props);
    return normalizeVNode(result);
  }

  if (vNode.type && typeof vNode.type === "string") {
    const normalizedChildren = vNode.children
      .map(normalizeVNode)
      .filter((child) => child !== "");

    return {
      type: vNode.type,
      props: vNode.props,
      children: normalizedChildren,
    };
  }

  return vNode;
}
