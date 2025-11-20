export function createVNode(type, props, ...children) {
  const flatFilterChildren = children
    .flat(Infinity)
    .filter(
      (child) => child !== null && child !== undefined && child !== false
    );
  return { type, props, children: flatFilterChildren };
}
