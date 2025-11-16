// 자식 평탄화 + null, undefined, false 제거
const normalizeChildren = (children) =>
  children
    .flat(Infinity)
    .filter(
      (child) => child !== false && child !== null && child !== undefined,
    );

export function createVNode(type, props, ...children) {
  return {
    type: type,
    props: props,
    children: normalizeChildren(children),
  };
}
