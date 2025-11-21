import { deepEquals } from "../utils";
import { DependencyList } from "./types";
import { useRef } from "./useRef";

/**
 * `deepEquals`를 사용하여 의존성을 깊게 비교하는 `useMemo` 훅입니다.
 */
export const useDeepMemo = <T>(factory: () => T, deps: DependencyList): T => {
  // useRef를 사용하여 이전 의존성 배열과 계산된 값을 저장합니다.
  // deepEquals 함수로 의존성을 비교하여 factory 함수를 재실행할지 결정합니다.
  const ref = useRef<{ deps: DependencyList; value: T } | undefined>(undefined);

  if (ref.current === undefined || !deepEquals(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() };
  }
  return ref.current.value;
};
