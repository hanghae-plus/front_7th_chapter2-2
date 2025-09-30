import { shallowEquals, withEnqueue } from "../utils";
import { context } from "./context";
import { EffectHook } from "./types";
import { enqueueRender } from "./render";
import { HookTypes } from "./constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isEffectHook = (value: any): value is EffectHook =>
  Boolean(value && typeof value === "object" && value.kind === HookTypes.EFFECT);

const resolveInitial = <T>(initialValue: T | (() => T)): T =>
  typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;

const queueEffect = (job: { path: string; cursor: number }): void => {
  context.effects.queue.push(job);
  flushEffects();
};

const flushEffects = withEnqueue(() => {
  while (context.effects.queue.length > 0) {
    const { path, cursor } = context.effects.queue.shift()!;
    const hook = context.hooks.state.get(path)?.[cursor];
    if (!isEffectHook(hook)) {
      continue;
    }

    hook.cleanup?.();
    hook.cleanup = hook.effect?.() ?? null;
  }
});

export const cleanupUnusedHooks = () => {
  const { state, visited } = context.hooks;
  Array.from(state.keys())
    .filter((path) => !visited.has(path))
    .forEach((path) => {
      state
        .get(path)
        ?.filter(isEffectHook)
        .forEach((value) => value.cleanup?.());

      state.delete(path);
    });
};

export const useState = <T>(initialValue: T | (() => T)): [T, (nextValue: T | ((prev: T) => T)) => void] => {
  const { hooks } = context;
  const { currentPath, currentCursor, currentHooks } = hooks;
  if (currentHooks.length <= currentCursor) {
    currentHooks[currentCursor] = resolveInitial(initialValue);
    hooks.state.set(currentPath, currentHooks);
  }

  hooks.cursor.set(currentPath, currentCursor + 1);
  return [
    currentHooks[currentCursor],
    (nextValue: T | ((prev: T) => T)) => {
      const previous = currentHooks[currentCursor];
      const value = typeof nextValue === "function" ? (nextValue as (prev: T) => T)(previous) : nextValue;
      if (Object.is(previous, value)) {
        return;
      }
      currentHooks[currentCursor] = value;
      hooks.state.set(currentPath, currentHooks);
      enqueueRender();
    },
  ];
};

export const useEffect = (effect: () => (() => void) | void, deps?: unknown[]): void => {
  const { hooks } = context;
  const currentPath = hooks.currentPath;
  const currentCursor = hooks.currentCursor;
  const currentHooks = hooks.currentHooks;
  const previous = currentHooks[currentCursor];
  const normalizedDeps = Array.isArray(deps) ? [...deps] : null;
  const previousDeps = isEffectHook(previous) ? previous.deps : null;
  const shouldRun =
    !isEffectHook(previous) ||
    normalizedDeps === null ||
    previousDeps === null ||
    !shallowEquals(previousDeps, normalizedDeps);

  currentHooks[currentCursor] = {
    kind: HookTypes.EFFECT,
    deps: normalizedDeps,
    cleanup: isEffectHook(previous) ? previous.cleanup : null,
    effect,
  };

  hooks.state.set(currentPath, currentHooks);
  hooks.cursor.set(currentPath, currentCursor + 1);

  if (shouldRun) {
    queueEffect({ path: currentPath, cursor: currentCursor });
  }
};
