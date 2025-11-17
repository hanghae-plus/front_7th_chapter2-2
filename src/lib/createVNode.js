export function createVNode(type, props, ...children) {
  const flattened = children.flat(Infinity);
  const filtered = flattened.filter(
    (child) =>
      child !== null &&
      child !== undefined &&
      child !== false &&
      child !== true,
  );

  return {
    type: type,
    props: props,
    children: filtered,
  };
}
