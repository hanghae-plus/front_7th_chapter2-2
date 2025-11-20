export function createVNode(type, props, ...children) {
  // children 불필요한 값 제거하기
  const flatChildren = children
    .flat(Infinity)
    .filter(
      (child) => child !== null && child !== undefined && child !== false,
    );
  return { type, props: props ?? null, children: flatChildren };
}
