import { deepEquals } from "../utils";
import { DependencyList } from "./types";
import { useMemo } from "./useMemo";

/**
 * `deepEquals`를 사용하여 의존성을 깊게 비교하는 `useMemo` 훅입니다.
 */
export const useDeepMemo = <T>(factory: () => T, deps: DependencyList): T => {
  // useMemo에 deepEquals를 equals 함수로 전달합니다.
  // 이렇게 하면 의존성을 깊게 비교하여 메모이제이션합니다.
  return useMemo(factory, deps, deepEquals);
};
