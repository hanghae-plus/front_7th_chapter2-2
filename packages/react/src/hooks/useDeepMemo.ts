import { deepEquals } from "../utils";
import { DependencyList } from "./types";
import { useMemo } from "./useMemo";

export function useDeepMemo<T>(factory: () => T, deps: DependencyList): T {
  return useMemo(factory, deps, deepEquals);
}
