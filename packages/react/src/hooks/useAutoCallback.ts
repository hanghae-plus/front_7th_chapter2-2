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
  // useRef를 사용하여 최신 함수를 저장
  const ref = useRef(fn);

  // 매 렌더링마다 최신 함수를 ref에 업데이트
  ref.current = fn;

  // useCallback으로 안정적인 참조를 가진 wrapper 함수 생성
  // 빈 의존성 배열로 함수 참조는 고정하되, 내부에서는 ref.current를 호출하여 항상 최신 함수 실행
  return useCallback(((...args) => ref.current(...args)) as T, []);
};
