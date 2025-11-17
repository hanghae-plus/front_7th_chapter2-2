const isRemovable = (child) =>
  child === "" || child === null || child === undefined || child === false;

const normalizeChildren = (children = []) =>
  children
    .flat()
    .map((child) => normalizeVNode(child))
    .flat()
    .filter((child) => !isRemovable(child));

export function normalizeVNode(vNode) {
  if (vNode === null || vNode === undefined || typeof vNode === "boolean") {
    return "";
  }

  if (typeof vNode === "string" || typeof vNode === "number") {
    return vNode.toString();
  }

  if (Array.isArray(vNode)) {
    return normalizeChildren(vNode);
  }

  if (typeof vNode === "object" && vNode !== null) {
    if (typeof vNode.type === "function") {
      const componentResult = vNode.type({
        ...(vNode.props ?? {}),
        children: vNode.children ?? [],
      });
      return normalizeVNode(componentResult);
    }

    if ("type" in vNode) {
      return {
        type: vNode.type,
        props: vNode.props ?? null,
        children: normalizeChildren(vNode.children),
      };
    }
  }

  if (typeof vNode === "function") {
    return normalizeVNode(vNode());
  }

  return vNode;
}
