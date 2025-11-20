export function createVNode(type, originProps = null, ...rawChildren) {
  const props = originProps == null ? null : { ...originProps };
  const children = rawChildren
    .flat(Infinity)
    .reduce((acc, child) => {
      if (child == null || typeof child === "boolean") {
        return acc;
      }

      acc.push(child);
      return acc;
    }, []);

  return {
    type,
    props,
    children,
  };
}
