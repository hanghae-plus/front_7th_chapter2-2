export function normalizeVNode(vNode) {
  if (vNode == null) return "";
  if (typeof vNode === "boolean") return "";
  if (typeof vNode === "number") return String(vNode);

  if (typeof vNode === "object") {
    if (typeof vNode.type === "function") {
      return normalizeVNode(
        vNode.type({
          children: vNode.children,
          ...vNode.props,
        }),
      );
    } else {
      return {
        ...vNode,
        children: vNode.children
          .map((child) => normalizeVNode(child))
          .filter((child) => child !== ""),
      };
    }
  }

  return vNode;
}
