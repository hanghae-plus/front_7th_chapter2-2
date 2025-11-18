export function normalizeVNode(vNode) {
  // 1. undefined, null, boolean 변환
  if (vNode == null || typeof vNode === "boolean") {
    return "";
  }
  // 2. string & number인 경우 string 변환
  if (typeof vNode === "string" || typeof vNode === "number") {
    return String(vNode);
  }
  // 3. 함수인 경우 호출한 반환값을 재귀 호출 (함수형 컴포넌트)
  if (typeof vNode === "function") {
    const result = vNode();
    return normalizeVNode(result);
  }
  // 4. 배열인 경우
  if (Array.isArray(vNode)) {
    // map 돌면서
    const normalizedChildren = vNode
      .map((child) => normalizeVNode(child))
      .flat()
      .filter(
        (child) =>
          !(child == null || child === "" || typeof child === "boolean"),
      );
    return normalizedChildren;
  }
  // 5. 객체인 경우
  if (typeof vNode === "object") {
    const { type, props = {}, children = [] } = vNode;
    // type이 func
    if (typeof type === "function") {
      // props와 children을 함께 전달
      const componentProps = { ...(props || {}), children };
      const rendered = type(componentProps);
      // 다시 재귀
      return normalizeVNode(rendered);
    }

    const normalizedChildren = (children || [])
      .map((child) => normalizeVNode(child))
      .flat()
      .filter(
        (child) =>
          !(child == null || child === "" || typeof child === "boolean"),
      );

    return {
      type,
      props,
      children: normalizedChildren,
    };
  }

  return "";
}
