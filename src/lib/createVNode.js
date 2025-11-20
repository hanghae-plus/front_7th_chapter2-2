export function createVNode(type, props, ...children) {
  const flattenedChildren = children.flat(Infinity);
  const validChildren = flattenedChildren.filter(
    (child) => child !== null && child !== undefined && child !== false,
  );
  return { type, props, children: validChildren };
}
