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
  // useRef를 사용하여 최신 함수를 저장합니다.
  const fnRef = useRef(fn);
  fnRef.current = fn;

  // useCallback을 사용하여 안정적인 함수 참조를 생성합니다.
  // 빈 의존성 배열을 사용하여 함수 참조는 변경되지 않지만, 내부에서 최신 fnRef.current를 호출합니다.
  return useCallback((...args: Parameters<T>) => fnRef.current(...args), []) as T;
};
