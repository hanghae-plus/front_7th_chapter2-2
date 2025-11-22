const isFalsy = (value) =>
  value === "" ||
  value === null ||
  value === undefined ||
  value === false ||
  value === true;

export function normalizeVNode(vNode) {
  if (vNode === null || vNode === undefined || typeof vNode === "boolean") {
    return "";
  }

  if (typeof vNode === "string" || typeof vNode === "number") {
    return vNode.toString();
  }

  if (vNode.type) {
    if (typeof vNode.type === "function") {
      const props = vNode.props || {};
      const result = vNode.type({ children: vNode.children, ...props });
      return normalizeVNode(result);
    }

    const children = vNode.children || [];
    const normalizedChildren = children
      .map(normalizeVNode)
      .filter((child) => !isFalsy(child));

    return {
      type: vNode.type,
      props: vNode.props,
      children: normalizedChildren,
    };
  }

  return "";
}
