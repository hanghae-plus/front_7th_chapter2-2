import {
  shallowEquals,
  // withEnqueue
} from "../utils";
import { context } from "./context";
import { EffectHook } from "./types";
import { enqueueRender } from "./render";
import { HookTypes } from "./constants";

/**
 * 사용되지 않는 컴포넌트의 훅 상태와 이펙트 클린업 함수를 정리합니다.
 */
export const cleanupUnusedHooks = () => {
  const allPaths = Array.from(context.hooks.state.keys());

  allPaths.forEach((path) => {
    if (!context.hooks.visited.has(path)) {
      const hooks = context.hooks.state.get(path) || [];
      hooks.forEach((hook) => {
        if (hook && typeof hook === "object" && hook.kind === HookTypes.EFFECT) {
          const effectHook = hook as EffectHook;
          if (effectHook.cleanup) effectHook.cleanup();
        }
      });

      context.hooks.state.delete(path);
      context.hooks.cursor.delete(path);
    }
  });
};

/**
 * 컴포넌트의 상태를 관리하기 위한 훅입니다.
 * @param initialValue - 초기 상태 값 또는 초기 상태를 반환하는 함수
 * @returns [현재 상태, 상태를 업데이트하는 함수]
 */
export const useState = <T>(initialValue: T | (() => T)): [T, (nextValue: T | ((prev: T) => T)) => void] => {
  // 1. 현재 컴포넌트의 훅 커서와 상태 배열을 가져옵니다.
  const path = context.hooks.currentPath;
  const cursor = context.hooks.currentCursor;
  const hooks = context.hooks.currentHooks;

  // 2. 첫 렌더링이라면 초기값으로 상태를 설정합니다.
  if (hooks[cursor] === undefined) {
    const value = typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
    hooks[cursor] = value;
  }

  // 3. 상태 변경 함수(setter)를 생성합니다.
  const state = hooks[cursor];

  //    - 새 값이 이전 값과 같으면(Object.is) 재렌더링을 건너뜁니다.
  //    - 값이 다르면 상태를 업데이트하고 재렌더링을 예약(enqueueRender)합니다.
  // 4. 훅 커서를 증가시키고 [상태, setter]를 반환합니다.
  const setState = (nextValue: T | ((prev: T) => T)) => {
    const newValue = typeof nextValue === "function" ? (nextValue as (prev: T) => T)(hooks[cursor]) : nextValue;

    if (Object.is(hooks[cursor], newValue)) return;

    hooks[cursor] = newValue;

    enqueueRender();
  };

  context.hooks.cursor.set(path, cursor + 1);

  return [state, setState];
};

/**
 * 컴포넌트의 사이드 이펙트를 처리하기 위한 훅입니다.
 * @param effect - 실행할 이펙트 함수. 클린업 함수를 반환할 수 있습니다.
 * @param deps - 의존성 배열. 이 값들이 변경될 때만 이펙트가 다시 실행됩니다.
 */
export const useEffect = (effect: () => (() => void) | void, deps?: unknown[]): void => {
  // 1. 이전 훅의 의존성 배열과 현재 의존성 배열을 비교(shallowEquals)합니다.
  const path = context.hooks.currentPath;
  const cursor = context.hooks.currentCursor;
  const hooks = context.hooks.currentHooks;

  // 2. 의존성이 변경되었거나 첫 렌더링일 경우, 이펙트 실행을 예약합니다.
  const prevEffect = hooks[cursor] as EffectHook | undefined;

  // 3. 이펙트 실행 전, 이전 클린업 함수가 있다면 먼저 실행합니다.
  let shouldRunEffect = false;

  if (!prevEffect) {
    shouldRunEffect = true;
  } else if (deps === undefined) {
    shouldRunEffect = true;
  } else if (prevEffect.deps === null) {
    shouldRunEffect = true;
  } else {
    shouldRunEffect = !shallowEquals(prevEffect.deps, deps);
  }

  // 4. 예약된 이펙트는 렌더링이 끝난 후 비동기로 실행됩니다.
  const newEffectHook: EffectHook = {
    kind: HookTypes.EFFECT,
    effect,
    deps: deps !== undefined ? deps : null,
    cleanup: prevEffect?.cleanup ?? null,
  };

  hooks[cursor] = newEffectHook;

  if (shouldRunEffect) context.effects.queue.push({ path, cursor });

  context.hooks.cursor.set(path, cursor + 1);
};
