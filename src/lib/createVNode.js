export function createVNode(type, props, ...children) {
  return {
    type: type,
    props: props,
    children: children
      .flat(Infinity)
      .filter(
        (child) => child !== null && child !== undefined && child !== false,
      ),
  };
}
