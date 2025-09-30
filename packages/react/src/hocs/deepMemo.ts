import { deepEquals } from "../utils";
import { memo } from "./memo";
import type { FunctionComponent } from "../core";

export function deepMemo<P extends object>(Component: FunctionComponent<P>) {
  return memo(Component, deepEquals);
}
