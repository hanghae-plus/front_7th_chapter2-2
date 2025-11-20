/**
 * 두 값의 얕은 동등성을 비교합니다.
 * 객체와 배열은 1단계 깊이까지만 비교합니다.
 */
export const shallowEquals = (a: unknown, b: unknown): boolean => {
  // Object.is()를 사용하여 기본 타입과 특수값(NaN, -0/+0) 비교
  if (Object.is(a, b)) {
    return true;
  }

  // 둘 중 하나라도 객체가 아니면 false (이미 Object.is로 비교했으므로)
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
    return false;
  }

  // 배열 비교
  if (Array.isArray(a) && Array.isArray(b)) {
    // 길이가 다르면 false
    if (a.length !== b.length) {
      return false;
    }
    // 각 요소를 Object.is로 비교 (1단계 깊이)
    for (let i = 0; i < a.length; i++) {
      if (!Object.is(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  // 하나만 배열이면 false
  if (Array.isArray(a) || Array.isArray(b)) {
    return false;
  }

  // 객체 비교
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  // 키의 개수가 다르면 false
  if (keysA.length !== keysB.length) {
    return false;
  }

  // 각 키의 값을 Object.is로 비교 (1단계 깊이)
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key) || 
        !Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
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
  // Object.is()를 사용하여 기본 타입과 특수값(NaN, -0/+0) 비교
  if (Object.is(a, b)) {
    return true;
  }

  // 둘 중 하나라도 객체가 아니면 false (이미 Object.is로 비교했으므로)
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
    return false;
  }

  // 배열 비교
  if (Array.isArray(a) && Array.isArray(b)) {
    // 길이가 다르면 false
    if (a.length !== b.length) {
      return false;
    }
    // 각 요소를 재귀적으로 비교
    for (let i = 0; i < a.length; i++) {
      if (!deepEquals(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  // 하나만 배열이면 false
  if (Array.isArray(a) || Array.isArray(b)) {
    return false;
  }

  // 객체 비교
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  // 키의 개수가 다르면 false
  if (keysA.length !== keysB.length) {
    return false;
  }

  // 각 키의 값을 재귀적으로 비교
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key) || 
        !deepEquals((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }

  return true;
};
