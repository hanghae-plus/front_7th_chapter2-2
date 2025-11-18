/**
 * 두 값의 얕은 동등성을 비교합니다.
 * 객체와 배열은 1단계 깊이까지만 비교합니다.
 */
export const shallowEquals = (a: unknown, b: unknown): boolean => {
  // 1. 동일성 검사 (NaN, -0/+0까지 정확한 판별)
  if (Object.is(a, b)) return true;

  // 2. null이거나 객체 타입이 아니면 false
  if (a == null || b == null || typeof a !== "object" || typeof b !== "object") {
    return false;
  }

  // 3. 배열 비교
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
      if (!Object.is(a[i], b[i])) return false;
    }

    return true;
  }
  // 4. 배열 type 비교
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  // 5. 객체 비교
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;

  for (const key of keysA) {
    if (!Object.is(objA[key], objB[key])) return false;
  }

  return true;
};

/**
 * 두 값의 깊은 동등성을 비교합니다.
 * 객체와 배열의 모든 중첩된 속성을 재귀적으로 비교합니다.
 */
export const deepEquals = (a: unknown, b: unknown): boolean => {
  // 1. 동일성 검사 (NaN, -0/+0까지 정확한 판별)
  if (Object.is(a, b)) return true;

  // 2. null이거나 객체 타입이 아니면 false
  if (a == null || b == null || typeof a !== "object" || typeof b !== "object") {
    return false;
  }

  // 3. 배열 비교
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
      if (!deepEquals(a[i], b[i])) {
        return false;
      }
    }

    return true;
  }

  // 4. 객체 비교
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;

  for (const key of keysA) {
    if (!deepEquals(objA[key], objB[key])) return false;
  }

  return true;
};
