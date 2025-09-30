import { DependencyList } from "./types";
import { useRef } from "./useRef";
import { shallowEquals } from "../utils";

export function useMemo<T>(factory: () => T, deps: DependencyList, equals = shallowEquals): T {
  const ref = useRef<{
    init: boolean;
    deps: typeof deps | undefined;
    value: T | undefined;
  }>({ init: false, deps, value: undefined });

  if (!ref.current.init || !equals(deps, ref.current.deps)) {
    ref.current.init = true;
    ref.current.deps = deps;
    ref.current.value = factory();
  }

  return ref.current.value as T;
}
