export function createVNode(type, props, ...children) {
  // children 배열을 평탄화하고 null, undefined, boolean 값 필터링
  const flattenChildren = (arr) => {
    return arr.reduce((acc, child) => {
      // null, undefined, boolean 값은 제외
      if (child == null || typeof child === "boolean") {
        return acc;
      }
      if (Array.isArray(child)) {
        return acc.concat(flattenChildren(child));
      }
      return acc.concat(child);
    }, []);
  };

  return {
    type,
    props,
    children: flattenChildren(children),
  };
}
