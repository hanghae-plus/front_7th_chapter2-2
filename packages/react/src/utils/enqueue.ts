import { AnyFunction } from "../types";

export const enqueue =
  typeof queueMicrotask === "function" ? queueMicrotask : (callback: () => void) => Promise.resolve().then(callback);

export const withEnqueue = (fn: AnyFunction) => {
  let scheduled = false;
  return () => {
    if (scheduled) return;
    scheduled = true;
    enqueue(() => {
      scheduled = false;
      fn();
    });
  };
};
