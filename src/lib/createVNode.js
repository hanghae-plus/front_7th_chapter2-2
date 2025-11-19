// 자식 평탄화 + falsy 값 제거 (false, null, undefined)
const normalizeChildren = (children) => {
  if (!Array.isArray(children)) {
    return [];
  }

  const normalized = children.flat(Infinity);
  return normalized.filter((child) => {
    return (
      child !== false && child !== null && child !== undefined && child !== ""
    );
  });
};

export function createVNode(type, props, ...children) {
  return {
    type: type,
    props: props || null,
    children: normalizeChildren(children),
  };
}
