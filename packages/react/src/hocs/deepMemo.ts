import type { FunctionComponent } from "../core";
import { deepEquals } from "../utils";
import { memo } from "./memo";

/**
 * `deepEquals`를 사용하여 props를 깊게 비교하는 `memo` HOC입니다.
 */
export function deepMemo<P extends object>(Component: FunctionComponent<P>) {
  // memo HOC와 deepEquals 함수를 사용해야 합니다.
  return memo(Component, deepEquals);
}
