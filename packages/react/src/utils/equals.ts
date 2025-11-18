/**
 * 두 값의 얕은 동등성을 비교합니다.
 * 객체와 배열은 1단계 깊이까지만 비교합니다.
 */
export const shallowEquals = (a: unknown, b: unknown): boolean => {
  // Object.is로 먼저 비교
  if (Object.is(a, b)) {
    return true;
  }

  // null이나 undefined 체크
  if (a == null || b == null) {
    return false;
  }

  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    return a.every((item, index) => Object.is(item, b[index]));
  }

  if (a?.constructor === Object && b?.constructor === Object) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    return (
      keysA.length === keysB.length &&
      keysA.every((key) => Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]))
    );
  }

  return false;
};

/**
 * 두 값의 깊은 동등성을 비교합니다.
 * 객체와 배열의 모든 중첩된 속성을 재귀적으로 비교합니다.
 */
export const deepEquals = (a: unknown, b: unknown): boolean => {
  // Object.is로 먼저 비교
  if (Object.is(a, b)) {
    return true;
  }

  // null이나 undefined 체크
  if (a == null || b == null) {
    return false;
  }

  // 배열 비교
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => deepEquals(item, b[i]));
  }

  // 객체 비교
  if (a?.constructor === Object && b?.constructor === Object) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    return (
      keysA.length === keysB.length &&
      keysA.every((key) => deepEquals((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]))
    );
  }

  return false;
};
