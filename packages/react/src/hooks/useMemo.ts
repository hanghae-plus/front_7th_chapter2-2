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
  // ref.current는 { deps, value } 형태의 객체를 저장합니다.
  const ref = useRef<{ deps: DependencyList; value: T } | null>(null);

  // 첫 렌더링이거나 의존성이 변경된 경우에만 factory를 실행합니다.
  if (ref.current === null || !equals(ref.current.deps, deps)) {
    const value = factory();
    ref.current = { deps, value };
    return value;
  }

  // 의존성이 변경되지 않았으면 이전 값을 반환합니다.
  return ref.current.value;
};
