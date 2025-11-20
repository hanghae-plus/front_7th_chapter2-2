function normalizeChildren(children = []) {
  const result = [];

  children.forEach(child => {
    const normalized = normalizeVNode(child);

    if (normalized === "" || normalized == null) {
      return;
    }

    if (Array.isArray(normalized)) {
      result.push(...normalized);
      return;
    }

    result.push(normalized);
  });

  return result;
}

export function normalizeVNode(vNode) {
  if (vNode == null || typeof vNode === "boolean") {
    return "";
  }

  if (typeof vNode === "string" || typeof vNode === "number") {
    return String(vNode);
  }

  if (Array.isArray(vNode)) {
    return normalizeChildren(vNode);
  }

  if (typeof vNode !== "object") {
    return "";
  }

  const { type, props = null, children = [] } = vNode;

  if (typeof type === "function") {
    const componentProps = { ...(props || {}) };
    const normalizedChildren = normalizeChildren(children);

    if (normalizedChildren.length === 1) {
      componentProps.children = normalizedChildren[0];
    } else if (normalizedChildren.length > 1) {
      componentProps.children = normalizedChildren;
    } else {
      delete componentProps.children;
    }

    const renderedVNode = type(componentProps);
    return normalizeVNode(renderedVNode);
  }

  const normalizedChildren = normalizeChildren(children);

  return {
    type,
    props: props == null ? null : { ...props },
    children: normalizedChildren,
  };
}
