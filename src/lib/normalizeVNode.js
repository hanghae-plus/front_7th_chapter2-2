export function normalizeVNode(vNode) {
  // null, undefined, boolean 값은 빈 문자열로 변환
  if (vNode == null || typeof vNode === "boolean") {
    return "";
  }

  // 문자열과 숫자는 문자열로 변환
  if (typeof vNode === "string" || typeof vNode === "number") {
    return String(vNode);
  }

  if (Array.isArray(vNode)) {
    return vNode.map(normalizeVNode).filter((child) => child !== "");
  }

  const { type, props, children } = vNode;

  // 함수형 컴포넌트 처리
  if (typeof type === "function") {
    const component = type;
    const componentProps = { ...props, children };
    const result = component(componentProps);
    return normalizeVNode(result);
  }

  return {
    type,
    props: props || null,
    children: (children || [])
      .map(normalizeVNode)
      .filter((child) => child !== ""),
  };
}
