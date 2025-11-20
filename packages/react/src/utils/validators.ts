/**
 * VNode가 렌더링되지 않아야 하는 값인지 확인합니다.
 * (예: null, undefined, boolean)
 *
 * @param value - 확인할 값
 * @returns 렌더링되지 않아야 하면 true, 그렇지 않으면 false
 */
export const isEmptyValue = (value: unknown): boolean => {
  // null, undefined, boolean 값은 렌더링하지 않습니다
  // React에서도 이러한 값들은 실제 DOM에 렌더링되지 않습니다
  return value == null || typeof value === "boolean";
};
