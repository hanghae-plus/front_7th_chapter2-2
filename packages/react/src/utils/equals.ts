/**
 * 두 값의 얕은 동등성을 비교합니다.
 * 객체와 배열은 1단계 깊이까지만 비교합니다.
 */
export const shallowEquals = (a: unknown, b: unknown): boolean => {
  // 여기를 구현하세요.
  // Object.is(), Array.isArray(), Object.keys() 등을 활용하여 1단계 깊이의 비교를 구현합니다.

  // 값 일치 여부 확인
  if (Object.is(a, b)) return true;

  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;

  // 배열 여부 확인
  const isArrayA = Array.isArray(a);
  const isArrayB = Array.isArray(b);

  if (isArrayA !== isArrayB) return false;

  // 배열일 경우
  if (isArrayA) {
    const arrA = a as unknown[];
    const arrB = b as unknown[];

    // 길이가 다를 경우 false
    if (arrA.length !== arrB.length) return false;

    for (let i = 0; i < arrA.length; i++) {
      // 값 일치 여부 확인
      if (!Object.is(arrA[i], arrB[i])) return false;
    }

    return true;
  }

  // 객체인 경우
  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  // 길이가 다를 경우 false
  if (keysA.length !== keysB.length) return false;

  // 순회하며 각 value값 일치 여부 확인
  for (const key of keysA) {
    if (!(key in objB)) return false;
    if (!Object.is(objA[key], objB[key])) return false;
  }

  return true;
};

/**
 * 두 값의 깊은 동등성을 비교합니다.
 * 객체와 배열의 모든 중첩된 속성을 재귀적으로 비교합니다.
 */
export const deepEquals = (a: unknown, b: unknown): boolean => {
  // 여기를 구현하세요.
  // 재귀적으로 deepEquals를 호출하여 중첩된 구조를 비교해야 합니다.

  // 값 일치 여부 확인
  if (Object.is(a, b)) return true;

  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;

  // 배열 여부 확인
  const isArrayA = Array.isArray(a);
  const isArrayB = Array.isArray(b);

  if (isArrayA !== isArrayB) return false;

  // 배열일 경우
  if (isArrayA) {
    const arrA = a as unknown[];
    const arrB = b as unknown[];

    // 길이가 다를 경우 false
    if (arrA.length !== arrB.length) return false;

    // 재귀 함수로 값 일치 여부 확인
    for (let i = 0; i < arrA.length; i++) {
      if (!deepEquals(arrA[i], arrB[i])) return false;
    }

    return true;
  }

  // 객체인 경우
  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  // 길이가 다를 경우 false
  if (keysA.length !== keysB.length) return false;

  // 재귀함수로 순회하며 각 value값 일치 여부 확인
  for (const key of keysA) {
    if (!(key in objB)) return false;
    if (!deepEquals(objA[key], objB[key])) return false;
  }

  return true;
};
