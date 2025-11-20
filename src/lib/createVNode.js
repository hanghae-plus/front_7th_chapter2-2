export function createVNode(type, props, ...children) {
  return {
    type,
    props: props || null,
    children: children.flat(2).filter((child) => {
      if (child == null) return false;
      if (typeof child === "boolean") return false;
      return true;
    }),
  };
}
