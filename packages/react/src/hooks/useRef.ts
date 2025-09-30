import { useState } from "../core";

export function useRef<T>(initialValue: T): { current: T } {
  const [ref] = useState(() => ({ current: initialValue }));
  return ref;
}
