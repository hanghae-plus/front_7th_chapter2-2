export function normalizeVNode(vNode) {
  // null, undefined, true, false는 빈 문자열로 변환
  if (
    vNode === null ||
    vNode === undefined ||
    vNode === true ||
    vNode === false
  ) {
    return "";
  }

  // 문자열과 숫자는 문자열로 변환
  if (typeof vNode === "string" || typeof vNode === "number") {
    return String(vNode);
  }

  // VNode 객체인지 확인 (type 속성이 있는 객체)
  if (typeof vNode === "object" && vNode !== null && "type" in vNode) {
    const { type, props, children } = vNode;

    // type이 함수면 컴포넌트 실행
    if (typeof type === "function") {
      const componentProps = { ...(props || {}), children };
      const componentResult = type(componentProps);
      return normalizeVNode(componentResult);
    }

    // 일반 요소인 경우, 자식들을 재귀적으로 정규화하고 falsy 값 제거
    const normalizedChildren = (children || [])
      .map((child) => normalizeVNode(child))
      .filter(
        (child) =>
          child !== null &&
          child !== undefined &&
          child !== false &&
          child !== true &&
          child !== "",
      );

    return {
      type,
      props: props || null,
      children: normalizedChildren,
    };
  }

  // 그 외의 경우는 그대로 반환
  return vNode;
}
