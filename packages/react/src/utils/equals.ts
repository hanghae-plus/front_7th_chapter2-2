/**
 * 두 값의 얕은 동등성을 비교합니다.
 * 객체와 배열은 1단계 깊이까지만 비교합니다.
 * Object.is(), Array.isArray(), Object.keys() 등을 활용하여 1단계 깊이의 비교를 구현합니다.
 */
export const shallowEquals = (a: unknown, b: unknown): boolean => {
  /* Object.is()는 두 값이 완전히 같은 메모리 주소를 가리키는지 비교하는 함수 (참조 비교) */
  if (Object.is(a, b)) {
    return true;
  }

  /* 두 값이 객체가 아니면 false */
  if (typeof a !== "object" || typeof b !== "object") {
    return false;
  }

  /* 두 값이 null이면 false */
  if (a === null || b === null) {
    return false;
  }

  /* 두 값의 키 개수가 다르면 false */
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  /* 두 값의 키 개수가 다르면 false */
  if (keysA.length !== keysB.length) {
    return false;
  }

  /* 두 값의 키 값을 Object.is()로 비교 */
  for (const key of keysA) {
    if (!Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }

  return true;
};

/**
 * 두 값의 깊은 동등성을 비교합니다.
 * 객체와 배열의 모든 중첩된 속성을 재귀적으로 비교합니다.
 * 재귀적으로 deepEquals를 호출하여 중첩된 구조를 비교해야 합니다.
 */
export const deepEquals = (a: unknown, b: unknown): boolean => {
  /* 두 값이 완전히 같은 메모리 주소를 가리키는지 비교 */
  if (Object.is(a, b)) {
    return true;
  }

  /* 두 값이 객체가 아니면 false */
  if (typeof a !== "object" || typeof b !== "object") {
    return false;
  }

  /* 두 값이 null이면 false */
  if (a === null || b === null) {
    return false;
  }

  // 4. 배열 처리
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }

    // 배열의 각 요소를 재귀적으로 비교!
    for (let i = 0; i < a.length; i++) {
      if (!deepEquals(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  // 5. 배열이 아닌 경우 (둘 중 하나라도 배열이면 false)
  if (Array.isArray(a) || Array.isArray(b)) {
    return false;
  }

  /* 두 값의 키 개수가 다르면 false */
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  /* 두 값의 키 개수가 다르면 false */
  if (keysA.length !== keysB.length) {
    return false;
  }

  /* 두 값의 키 값을 재귀적으로 deepEquals()로 비교 */
  for (const key of keysA) {
    if (!deepEquals((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }

  /* 두 값이 모두 객체이고 키 개수가 같고 키 값이 모두 같으면 true */
  return true;
};
