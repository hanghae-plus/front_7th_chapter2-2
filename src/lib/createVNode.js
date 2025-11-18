export function createVNode(type, props, ...children) {
  return {
    type: type,
    props: props || null,
    children: [...children]
      .flat(Infinity)
      .filter(
        (child) =>
          child !== false &&
          child !== true &&
          child !== null &&
          child !== undefined,
      ),
  };
}
