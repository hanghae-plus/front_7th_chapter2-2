/**
 * 두 값의 얕은 동등성을 비교합니다.
 * 객체와 배열은 1단계 깊이까지만 비교합니다.
 */
export const shallowEquals = (a: unknown, b: unknown): boolean => {
  // 여기를 구현하세요.
  // Object.is(), Array.isArray(), Object.keys() 등을 활용하여 1단계 깊이의 비교를 구현합니다.

  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => item === b[index]);
  }

  if (a !== null && b !== null && typeof a === "object" && typeof b === "object") {
    const objA = a as Record<string, unknown>;
    const objB = b as Record<string, unknown>;

    const aKeys = Object.keys(objA);
    const bKeys = Object.keys(objB);

    // key 개수 다르면 false
    if (aKeys.length !== bKeys.length) return false;

    // shallow compare
    return aKeys.every((key) => Object.is(objA[key], objB[key]));
  }

  return a === b;
};

/**
 * 두 값의 깊은 동등성을 비교합니다.
 * 객체와 배열의 모든 중첩된 속성을 재귀적으로 비교합니다.
 */
export const deepEquals = (a: unknown, b: unknown): boolean => {
  // 여기를 구현하세요.
  // 재귀적으로 deepEquals를 호출하여 중첩된 구조를 비교해야 합니다.

  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => deepEquals(item, b[index]));
  }

  if (a !== null && b !== null && typeof a === "object" && typeof b === "object") {
    const objA = a as Record<string, unknown>;
    const objB = b as Record<string, unknown>;
    const aKeys = Object.keys(objA);
    const bKeys = Object.keys(objB);

    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every((key) => deepEquals(objA[key], objB[key]));
  }

  return a === b;
};
