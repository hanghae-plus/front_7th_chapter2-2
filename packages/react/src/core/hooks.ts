import { shallowEquals, withEnqueue } from "../utils";
import { HookTypes } from "./constants";
import { context } from "./context";
import { enqueueRender } from "./render";
import { EffectHook } from "./types";

// useEffect에서 예약된 이펙트들을 한 번에 비동기로 실행하기 위한 헬퍼
const flushEffects = withEnqueue(() => {
  const {
    effects: { queue },
    hooks: { state },
  } = context;

  while (queue.length) {
    const { path, cursor } = queue.shift()!;
    const hooksForPath = state.get(path);
    if (!hooksForPath) continue;

    const hook = hooksForPath[cursor] as EffectHook | undefined;
    if (!hook || hook.kind !== HookTypes.EFFECT) continue;

    // 이전 cleanup 함수가 있으면 먼저 실행
    hook.cleanup?.();

    // 새로운 effect 실행하고 cleanup 저장
    const result = hook.effect();
    hook.cleanup = typeof result === "function" ? result : null;
  }
});

/**
 * 사용되지 않는 컴포넌트의 훅 상태와 이펙트 클린업 함수를 정리합니다.
 */
export const cleanupUnusedHooks = () => {
  const {
    hooks: { state, cursor, visited },
    effects,
  } = context;

  for (const [path, hooks] of state.entries()) {
    if (!visited.has(path)) {
      hooks.forEach((hook) => {
        if ((hook as EffectHook)?.kind === HookTypes.EFFECT) (hook as EffectHook).cleanup?.();
      });
      state.delete(path);
      cursor.delete(path);
    }
  }

  visited.clear();
  effects.queue = effects.queue.filter(({ path }) => state.has(path));
};

/**
 * 컴포넌트의 상태를 관리하기 위한 훅입니다.
 * @param initialValue - 초기 상태 값 또는 초기 상태를 반환하는 함수
 * @returns [현재 상태, 상태를 업데이트하는 함수]
 */
export const useState = <T>(initialValue: T | (() => T)): [T, (nextValue: T | ((prev: T) => T)) => void] => {
  // 1. 현재 컴포넌트의 훅 커서와 상태 배열을 가져옵니다.
  const {
    hooks: { state, cursor, visited, currentPath, currentCursor, currentHooks },
  } = context;
  const path = currentPath;
  const hookIndex = currentCursor;
  const hooksForPath = state.get(path) ?? currentHooks;

  if (!state.has(path)) state.set(path, hooksForPath);

  // 2. 첫 렌더링이라면 초기값으로 상태를 설정합니다.
  if (hookIndex >= hooksForPath.length) {
    const value = typeof initialValue === "function" ? (initialValue as () => T)() : (initialValue as T);
    hooksForPath.push(value);
  }

  const currentState = hooksForPath[hookIndex] as T;

  // 3. 상태 변경 함수(setter)를 생성합니다.
  //    - 새 값이 이전 값과 같으면(Object.is) 재렌더링을 건너뜁니다.
  //    - 값이 다르면 상태를 업데이트하고 재렌더링을 예약(enqueueRender)합니다.
  const setState = (nextValue: T | ((prev: T) => T)) => {
    const prev = hooksForPath![hookIndex] as T;
    const resolved = typeof nextValue === "function" ? (nextValue as (prev: T) => T)(prev) : (nextValue as T);

    if (Object.is(prev, resolved)) return;

    hooksForPath[hookIndex] = resolved;
    enqueueRender();
  };

  // 4. 훅 커서를 증가시키고 [상태, setter]를 반환합니다.
  cursor.set(path, hookIndex + 1);
  visited.add(path);

  return [currentState, setState];
};

/**
 * 컴포넌트의 사이드 이펙트를 처리하기 위한 훅입니다.
 * @param effect - 실행할 이펙트 함수. 클린업 함수를 반환할 수 있습니다.
 * @param deps - 의존성 배열. 이 값들이 변경될 때만 이펙트가 다시 실행됩니다.
 */
export const useEffect = (effect: () => (() => void) | void, deps?: unknown[]): void => {
  const {
    hooks: { state, cursor, visited, currentPath, currentCursor, currentHooks },
    effects,
  } = context;
  const path = currentPath;
  const hookIndex = currentCursor;
  const hooksForPath = state.get(path) ?? currentHooks;

  if (!state.has(path)) state.set(path, hooksForPath);

  const prevHook = hooksForPath[hookIndex] as EffectHook | undefined;
  const prevDeps = prevHook?.deps;

  // 1. 이전 훅의 의존성 배열과 현재 의존성 배열을 비교(shallowEquals)합니다.
  const shouldRun = !deps || !prevHook || !prevDeps || !shallowEquals(prevDeps, deps);

  // 2. 의존성이 변경되었거나 첫 렌더링일 경우, 이펙트 실행을 예약합니다.
  if (shouldRun) {
    effects.queue.push({ path, cursor: hookIndex });

    // 3. 이펙트 실행 전, 이전 클린업 함수가 있다면 먼저 실행합니다.
    // 4. 예약된 이펙트는 렌더링이 끝난 후 비동기로 실행됩니다.
    flushEffects();
  }

  hooksForPath[hookIndex] = {
    kind: HookTypes.EFFECT,
    deps: deps ?? null,
    cleanup: prevHook?.cleanup ?? null,
    effect,
  };

  cursor.set(path, hookIndex + 1);
  visited.add(path);
};
