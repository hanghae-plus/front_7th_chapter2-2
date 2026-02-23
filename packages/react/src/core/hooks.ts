import { shallowEquals, withEnqueue } from "../utils";
import { context } from "./context";
import { EffectHook } from "./types";
import { enqueueRender } from "./render";
import { HookTypes } from "./constants";

/**
 * 사용되지 않는 컴포넌트의 훅 상태와 이펙트 클린업 함수를 정리합니다.
 */
export const cleanupUnusedHooks = () => {
  const { state, cursor, visited } = context.hooks;

  for (const [path, hooks] of Array.from(state.entries())) {
    if (visited.has(path)) continue;

    hooks.forEach((hook) => {
      if (isEffectHook(hook) && hook.cleanup) {
        hook.cleanup();
        hook.cleanup = null;
      }
    });

    state.delete(path);
    cursor.delete(path);
  }

  context.effects.queue = context.effects.queue.filter(({ path }) => state.has(path));
  visited.clear();
};

/**
 * 컴포넌트의 상태를 관리하기 위한 훅입니다.
 * @param initialValue - 초기 상태 값 또는 초기 상태를 반환하는 함수
 * @returns [현재 상태, 상태를 업데이트하는 함수]
 */
export const useState = <T>(initialValue: T | (() => T)): [T, (nextValue: T | ((prev: T) => T)) => void] => {
  const path = context.hooks.currentPath;
  const hookIndex = context.hooks.currentCursor;
  const hooksForComponent = ensureHookArray(path);

  if (hooksForComponent[hookIndex] === undefined) {
    hooksForComponent[hookIndex] = typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
  }

  const setState = (nextValue: T | ((prev: T) => T)) => {
    const targetHooks = context.hooks.state.get(path);
    if (!targetHooks) return;
    const prev = targetHooks[hookIndex];
    const value = typeof nextValue === "function" ? (nextValue as (prev: T) => T)(prev) : nextValue;

    if (Object.is(prev, value)) return;

    targetHooks[hookIndex] = value;
    enqueueRender();
  };

  context.hooks.cursor.set(path, hookIndex + 1);

  return [hooksForComponent[hookIndex] as T, setState];
};

/**
 * 컴포넌트의 사이드 이펙트를 처리하기 위한 훅입니다.
 * @param effect - 실행할 이펙트 함수. 클린업 함수를 반환할 수 있습니다.
 * @param deps - 의존성 배열. 이 값들이 변경될 때만 이펙트가 다시 실행됩니다.
 */
export const useEffect = (effect: () => (() => void) | void, deps?: unknown[]): void => {
  const path = context.hooks.currentPath;
  const hookIndex = context.hooks.currentCursor;
  const hooksForComponent = ensureHookArray(path);

  const prevHook = hooksForComponent[hookIndex] as EffectHook | undefined;
  const normalizedDeps = deps === undefined ? null : deps;

  let shouldRun = false;
  if (normalizedDeps === null) {
    shouldRun = true;
  } else if (!prevHook || prevHook.deps === null) {
    shouldRun = true;
  } else if (!shallowEquals(prevHook.deps, normalizedDeps)) {
    shouldRun = true;
  }

  const hook: EffectHook = {
    kind: HookTypes.EFFECT,
    deps: normalizedDeps,
    cleanup: prevHook?.cleanup ?? null,
    effect,
  };

  hooksForComponent[hookIndex] = hook;

  if (shouldRun) {
    context.effects.queue.push({ path, cursor: hookIndex });
  }

  context.hooks.cursor.set(path, hookIndex + 1);
};

const ensureHookArray = (path: string) => {
  let hooksForComponent = context.hooks.state.get(path);
  if (!hooksForComponent) {
    hooksForComponent = [];
    context.hooks.state.set(path, hooksForComponent);
  }
  return hooksForComponent;
};

const isEffectHook = (hook: unknown): hook is EffectHook => {
  return Boolean(hook && typeof hook === "object" && (hook as EffectHook).kind === HookTypes.EFFECT);
};

const runPendingEffects = () => {
  const { queue } = context.effects;
  while (queue.length) {
    const task = queue.shift();
    if (!task) continue;
    const hooksForComponent = context.hooks.state.get(task.path);
    if (!hooksForComponent) continue;
    const hook = hooksForComponent[task.cursor] as EffectHook | undefined;
    if (!isEffectHook(hook)) continue;

    if (hook.cleanup) {
      hook.cleanup();
      hook.cleanup = null;
    }

    const cleanup = hook.effect();
    hook.cleanup = typeof cleanup === "function" ? cleanup : null;
  }
};

export const flushEffects = withEnqueue(runPendingEffects);
