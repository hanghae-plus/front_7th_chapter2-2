export function createVNode(type, props, ...children) {
  return {
    type,
    props: props === null ? null : props || {},
    children: children
      .flat(Infinity)
      .filter(
        (child) => child !== null && child !== undefined && child !== false,
      ),
  };
}
