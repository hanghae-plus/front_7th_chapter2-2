function isValidChild(child) {
  return (
    child !== null && child !== undefined && child !== false && child !== ""
  );
}

function normalizeChildren(children) {
  return (children || [])
    .map((child) => normalizeVNode(child))
    .filter(isValidChild);
}

function normalizeFunctionComponent(vNode) {
  const props = { ...(vNode.props || {}) };
  if (vNode.children !== undefined) {
    props.children = vNode.children;
  }
  const result = vNode.type(props);
  return normalizeVNode(result);
}

export function normalizeVNode(vNode) {
  if (vNode === null || vNode === undefined || typeof vNode === "boolean") {
    return "";
  }

  if (typeof vNode === "string") {
    return vNode;
  }

  if (typeof vNode === "number") {
    return String(vNode);
  }

  if (Array.isArray(vNode)) {
    return vNode;
  }

  if (typeof vNode !== "object") {
    return vNode;
  }

  if (!vNode.type) {
    return vNode;
  }

  if (typeof vNode.type === "function") {
    return normalizeFunctionComponent(vNode);
  }

  const normalizedChildren = normalizeChildren(vNode.children);

  return {
    type: vNode.type,
    props: vNode.props || null,
    children: normalizedChildren,
  };
}
