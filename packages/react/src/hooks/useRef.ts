import { useState } from "../core";

/**
 * 리렌더링되어도 변경되지 않는 참조(reference) 객체를 반환합니다.
 * .current 속성을 통해 값에 접근하고 변경할 수 있습니다.
 *
 * @param initialValue - ref 객체의 초기 .current 값
 * @returns `{ current: T }` 형태의 ref 객체
 */
export const useRef = <T>(initialValue: T): { current: T } => {
  // useState를 사용하여 ref 객체를 한 번만 생성합니다.
  // useState의 initializer 함수는 첫 렌더링에만 실행되므로
  // ref 객체가 한 번만 생성되고 이후 렌더링에서는 재사용됩니다.
  const [ref] = useState(() => ({ current: initialValue }));
  return ref;
};
