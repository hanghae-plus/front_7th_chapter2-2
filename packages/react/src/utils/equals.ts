/**
 * 두 값의 얕은 동등성을 비교합니다.
 * 객체와 배열은 1단계 깊이까지만 비교합니다.
 */
export const shallowEquals = (a: unknown, b: unknown): boolean => {
  // 여기를 구현하세요.
  // Object.is(), Array.isArray(), Object.keys() 등을 활용하여 1단계 깊이의 비교를 구현합니다.

  // 1. 참조가 같으면 true
  if (Object.is(a, b)) return true;

  // 2. null 이거나 객체가 아니면 false
  if (a == null || b == null || typeof a !== "object" || typeof b !== "object") return false;

  // 3. 배열인 경우
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
      if (!Object.is(a[i], b[i])) return false;
    }
    return true;
  }

  // 4. 객체인 경우
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return Object.entries(a).every(([key, value]) => {
    if (!(key in b)) return false;

    const bValue = b[key as keyof typeof b] as object;
    return Object.is(value, bValue);
  });
};

/**
 * 두 값의 깊은 동등성을 비교합니다.
 * 객체와 배열의 모든 중첩된 속성을 재귀적으로 비교합니다.
 */
export const deepEquals = (a: unknown, b: unknown): boolean => {
  // 여기를 구현하세요.
  // 재귀적으로 deepEquals를 호출하여 중첩된 구조를 비교해야 합니다.

  // 1. 참조가 같으면 true
  if (Object.is(a, b)) return true;

  // 2. null 이거나 객체가 아니면 false
  if (a == null || b == null || typeof a !== "object" || typeof b !== "object") return false;

  // 3. 배열인 경우 - 재귀적으로 비교
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEquals(a[i], b[i])) return false;
    }
    return true;
  }

  // 4. 하나만 배열이면 false
  if (Array.isArray(a) || Array.isArray(b)) return false;

  // 5. 객체인 경우 - 재귀적으로 비교
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return Object.entries(a).every(([key, value]) => {
    if (!(key in b)) return false;
    const bValue = b[key as keyof typeof b] as object;
    return deepEquals(value, bValue);
  });
};
