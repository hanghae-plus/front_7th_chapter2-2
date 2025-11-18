import type { AnyFunction } from "../types";
import { useCallback } from "./useCallback";
import { useRef } from "./useRef";

/**
 * 항상 최신 상태를 참조하면서도, 함수 자체의 참조는 변경되지 않는 콜백을 생성합니다.
 *
 * @param fn - 최신 상태를 참조할 함수
 * @returns 참조가 안정적인 콜백 함수
 */
export const useAutoCallback = <T extends AnyFunction>(fn: T): T => {
  // useRef를 사용하여 항상 최신 함수를 참조합니다.
  const fnRef = useRef(fn);

  // 매 렌더링마다 최신 함수로 업데이트
  fnRef.current = fn;

  // useCallback으로 함수 참조를 고정합니다 (deps = [])
  // 실제 호출 시에는 ref를 통해 최신 함수를 실행합니다.
  // Parameters<T>를 사용하여 타입 안전하게 매개변수를 처리합니다.
  return useCallback(((...args: Parameters<T>) => fnRef.current(...args)) as T, []);
};
