import { shallowEquals } from "../utils";
import { context } from "./context";
import { EffectHook } from "./types";
import { HookTypes } from "./constants";

/**
 * 사용되지 않는 컴포넌트의 훅 상태와 이펙트 클린업 함수를 정리합니다.
 */
export const cleanupUnusedHooks = () => {
  // visited에 포함되지 않은 경로는 더 이상 사용되지 않는 컴포넌트
  const pathsToDelete: string[] = [];

  // state Map을 순회하며 사용되지 않는 경로 찾기
  for (const path of context.hooks.state.keys()) {
    if (!context.hooks.visited.has(path)) {
      pathsToDelete.push(path);
    }
  }

  // 사용되지 않는 경로의 훅들을 정리
  for (const path of pathsToDelete) {
    // 해당 경로의 훅 배열 가져오기
    const hooks = context.hooks.state.get(path);

    if (hooks) {
      // 각 훅을 순회하며 이펙트 클린업 실행
      for (const hook of hooks) {
        // 이펙트 훅인 경우 클린업 함수 실행
        if (hook && typeof hook === "object" && hook.kind === HookTypes.EFFECT) {
          const effectHook = hook as EffectHook;
          if (effectHook.cleanup) {
            effectHook.cleanup();
            effectHook.cleanup = null;
          }
        }
      }
    }

    // 해당 경로의 모든 훅 상태 제거
    context.hooks.state.delete(path);
    context.hooks.cursor.delete(path);
  }
};

/**
 * 컴포넌트의 상태를 관리하기 위한 훅입니다.
 * @param initialValue - 초기 상태 값 또는 초기 상태를 반환하는 함수
 * @returns [현재 상태, 상태를 업데이트하는 함수]
 */
export const useState = <T>(initialValue: T | (() => T)): [T, (nextValue: T | ((prev: T) => T)) => void] => {
  // 1. 현재 컴포넌트의 훅 커서와 상태 배열을 가져옵니다
  const currentPath = context.hooks.currentPath;
  const currentCursor = context.hooks.currentCursor;
  const hooks = context.hooks.currentHooks;

  // 2. 첫 렌더링이라면 초기값으로 상태를 설정합니다
  if (currentCursor >= hooks.length) {
    // initialValue가 함수면 실행하여 초기값을 얻음
    const initialState = typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;

    // 새 상태를 훅 배열에 추가
    hooks.push(initialState);
  }

  // 현재 상태 값
  const state = hooks[currentCursor];

  // 3. 상태 변경 함수(setter)를 생성합니다
  // setState는 클로저로 currentPath와 currentCursor를 캡처합니다
  const setState = (nextValue: T | ((prev: T) => T)) => {
    // hooks 배열을 다시 가져옵니다 (클로저이므로)
    const stateArray = context.hooks.state.get(currentPath)!;
    const prevState = stateArray[currentCursor];

    // nextValue가 함수면 이전 상태를 인자로 전달하여 실행
    const newState = typeof nextValue === "function" ? (nextValue as (prev: T) => T)(prevState) : nextValue;

    // 새 값이 이전 값과 같으면(Object.is) 재렌더링을 건너뜁니다
    if (Object.is(prevState, newState)) {
      return;
    }

    // 값이 다르면 상태를 업데이트하고 재렌더링을 예약합니다
    stateArray[currentCursor] = newState;
    // 렌더링 스케줄링 (순환 import 방지를 위해 context를 통해 접근)
    if (context.scheduleRender) {
      context.scheduleRender();
    }
  };

  // 4. 훅 커서를 증가시키고 [상태, setter]를 반환합니다
  context.hooks.cursor.set(currentPath, currentCursor + 1);

  return [state, setState];
};

/**
 * 컴포넌트의 사이드 이펙트를 처리하기 위한 훅입니다.
 * @param effect - 실행할 이펙트 함수. 클린업 함수를 반환할 수 있습니다.
 * @param deps - 의존성 배열. 이 값들이 변경될 때만 이펙트가 다시 실행됩니다.
 */
export const useEffect = (effect: () => (() => void) | void, deps?: unknown[]): void => {
  // 현재 컴포넌트의 훅 커서와 상태 배열을 가져옵니다
  const currentPath = context.hooks.currentPath;
  const currentCursor = context.hooks.currentCursor;
  const hooks = context.hooks.currentHooks;

  // deps가 undefined면 null로 처리 (항상 실행)
  const normalizedDeps = deps === undefined ? null : deps;

  // 첫 렌더링이거나 이 위치에 훅이 없으면 새 이펙트 훅 생성
  if (currentCursor >= hooks.length) {
    const effectHook: EffectHook = {
      kind: HookTypes.EFFECT,
      deps: normalizedDeps,
      cleanup: null,
      effect,
    };
    hooks.push(effectHook);

    // 이펙트 실행을 예약합니다
    context.effects.queue.push({ path: currentPath, cursor: currentCursor });
  } else {
    // 이전 이펙트 훅 가져오기
    const prevEffectHook = hooks[currentCursor] as EffectHook;

    // 1. 이전 훅의 의존성 배열과 현재 의존성 배열을 비교(shallowEquals)합니다
    const depsChanged =
      normalizedDeps === null
        ? true // deps가 없으면 항상 실행
        : !shallowEquals(prevEffectHook.deps, normalizedDeps);

    // 2. 의존성이 변경되었을 경우, 이펙트 실행을 예약합니다
    if (depsChanged) {
      // 이펙트 정보 업데이트
      prevEffectHook.deps = normalizedDeps;
      prevEffectHook.effect = effect;

      // 이펙트 실행을 예약합니다
      context.effects.queue.push({ path: currentPath, cursor: currentCursor });
    }
  }

  // 훅 커서를 증가시킵니다
  context.hooks.cursor.set(currentPath, currentCursor + 1);
};
