/**
 * 두 값의 얕은 동등성을 비교합니다.
 * 객체와 배열은 1단계 깊이까지만 비교합니다.
 */
export const shallowEquals = (a: unknown, b: unknown): boolean => {
  // 1. 참조 동일성 검사 (Object.is 사용)
  if (Object.is(a, b)) {
    return true;
  }

  // 2. null/undefined 처리
  if (a == null || b == null) {
    return false;
  }

  // 3. 타입 검사
  if (typeof a !== typeof b) {
    return false;
  }

  // 4. 객체가 아니면 이미 Object.is에서 처리됨
  if (typeof a !== "object" || typeof b !== "object") {
    return false;
  }

  // 5. 객체/배열 1단계 깊이 비교
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  // 키 개수가 다르면 false
  if (keysA.length !== keysB.length) {
    return false;
  }

  // 각 키의 값을 Object.is()로 비교
  for (const key of keysA) {
    if (
      !Object.prototype.hasOwnProperty.call(b, key) ||
      !Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    ) {
      return false;
    }
  }

  return true;
};

/**
 * 두 값의 깊은 동등성을 비교합니다.
 * 객체와 배열의 모든 중첩된 속성을 재귀적으로 비교합니다.
 */
export const deepEquals = (a: unknown, b: unknown): boolean => {
  // 1. 참조 동일성 검사
  if (Object.is(a, b)) {
    return true;
  }

  // 2. null/undefined 처리
  if (a == null || b == null) {
    return false;
  }

  // 3. 타입 검사
  if (typeof a !== typeof b) {
    return false;
  }

  // 4. 객체가 아니면 이미 Object.is에서 처리됨
  if (typeof a !== "object" || typeof b !== "object") {
    return false;
  }

  // 5. 배열 처리
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!deepEquals(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  // 6. 배열과 객체 타입이 다르면 false
  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }

  // 7. 객체 재귀적 깊은 비교
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) {
      return false;
    }
    if (!deepEquals((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }

  return true;
};
