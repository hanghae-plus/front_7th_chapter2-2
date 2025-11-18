import { DependencyList } from "./types";
import { useRef } from "./useRef";
import { shallowEquals } from "../utils";

/**
 * 계산 비용이 큰 함수의 결과를 메모이제이션합니다.
 * 의존성 배열(deps)의 값이 변경될 때만 함수를 다시 실행합니다.
 *
 * @param factory - 메모이제이션할 값을 생성하는 함수
 * @param deps - 의존성 배열
 * @param equals - 의존성을 비교할 함수 (기본값: shallowEquals)
 * @returns 메모이제이션된 값
 */
export const useMemo = <T>(factory: () => T, deps: DependencyList, equals = shallowEquals): T => {
  // useRef를 사용하여 이전 의존성과 계산된 값을 저장합니다.
  const prevDepsRef = useRef<DependencyList | null>(null);
  const memoizedValueRef = useRef<T | null>(null);

  // 이전 deps가 없거나, deps가 변경된 경우에만 factory 함수 실행
  if (prevDepsRef.current === null || !equals(prevDepsRef.current, deps)) {
    // 새로 계산하고 결과 저장
    prevDepsRef.current = deps;
    memoizedValueRef.current = factory();
  }

  // 메모이제이션된 값 반환
  return memoizedValueRef.current!;
};
