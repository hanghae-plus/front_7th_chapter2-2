/**
 * VNode를 정규화
 * - null, undefined, boolean → 빈 문자열
 * - 숫자 → 문자열로 변환
 * - 함수형 컴포넌트 → 실행하여 반환된 VNode를 재귀 정규화
 * - 배열의 falsy 값 제거
 * @param {*} vNode - 정규화할 VNode
 * @returns {*} - 정규화된 VNode
 */
export function normalizeVNode(vNode) {
  // Step 1: null, undefined, boolean은 빈 문자열로 변환
  if (vNode == null || typeof vNode === "boolean") {
    return "";
  }

  // Step 2: 숫자는 문자열로 변환
  if (typeof vNode === "number") {
    return String(vNode);
  }

  // Step 3: 문자열은 그대로 반환
  if (typeof vNode === "string") {
    return vNode;
  }

  // Step 4: 배열 처리 - 각 항목을 정규화하고 falsy 값 제거
  if (Array.isArray(vNode)) {
    return vNode
      .map((item) => normalizeVNode(item))
      .filter((item) => item !== ""); // 빈 문자열(falsy) 제거
  }

  // Step 5: 객체(VNode) 처리
  if (typeof vNode === "object") {
    const { type, props, children } = vNode;

    // Step 5-1: 함수형 컴포넌트 처리
    // 함수를 호출하여 반환된 VNode를 재귀적으로 정규화
    if (typeof type === "function") {
      // children을 props에 포함시켜서 컴포넌트에 전달
      // props가 null이면 children만 포함한 객체 생성
      const componentProps = {
        ...(props || {}),
        children: children && children.length > 0 ? children : undefined,
      };
      const componentVNode = type(componentProps);
      return normalizeVNode(componentVNode);
    }

    // Step 5-2: HTML 태그 요소 처리
    if (typeof type === "string") {
      return {
        type,
        props,
        // children 정규화: 각 자식을 정규화하고 빈 문자열 제거
        children: (children || [])
          .map((child) => normalizeVNode(child))
          .filter((child) => child !== ""),
      };
    }
  }

  // 예상 밖의 타입
  return "";
}
