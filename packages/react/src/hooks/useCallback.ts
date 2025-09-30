import { DependencyList } from "./types";
import { useMemo } from "./useMemo";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: DependencyList): T {
  return useMemo(() => callback, deps);
}
