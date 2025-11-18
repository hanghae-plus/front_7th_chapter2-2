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
  // 여기를 구현하세요.

  const {
    hooks,
    // effects
  } = context;
  const pathsToDelete: string[] = [];

  // visited에 없는 경로들을 찾아서 정리
  for (const path of hooks.state.keys()) {
    if (!hooks.visited.has(path)) {
      pathsToDelete.push(path);

      // 해당 경로의 이펙트 클린업 실행
      const pathHooks = hooks.state.get(path) || [];
      for (let i = 0; i < pathHooks.length; i++) {
        const hook = pathHooks[i];
        if (hook && hook.kind === HookTypes.EFFECT && hook.cleanup) {
          hook.cleanup();
        }
      }
    }
  }

  // 상태 제거
  for (const path of pathsToDelete) {
    hooks.state.delete(path);
    hooks.cursor.delete(path);
  }

  // 다음 렌더링을 위해 visited 초기화
  hooks.visited.clear();
};

/**
 * 컴포넌트의 상태를 관리하기 위한 훅입니다.
 * @param initialValue - 초기 상태 값 또는 초기 상태를 반환하는 함수
 * @returns [현재 상태, 상태를 업데이트하는 함수]
 */
export const useState = <T>(initialValue: T | (() => T)): [T, (nextValue: T | ((prev: T) => T)) => void] => {
  // 여기를 구현하세요.
  // 1. 현재 컴포넌트의 훅 커서와 상태 배열을 가져옵니다.
  // 2. 첫 렌더링이라면 초기값으로 상태를 설정합니다.
  // 3. 상태 변경 함수(setter)를 생성합니다.
  //    - 새 값이 이전 값과 같으면(Object.is) 재렌더링을 건너뜁니다.
  //    - 값이 다르면 상태를 업데이트하고 재렌더링을 예약(enqueueRender)합니다.
  // 4. 훅 커서를 증가시키고 [상태, setter]를 반환합니다.

  const { hooks } = context;
  const path = hooks.currentPath;
  const cursor = hooks.currentCursor;
  const hookState = hooks.currentHooks;

  // 첫 렌더링이라면 초기값 설정
  if (cursor >= hookState.length) {
    const initial = typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
    hookState.push(initial);
  }

  const state = hookState[cursor];

  const setState = (nextValue: T | ((prev: T) => T)) => {
    const currentHooks = context.hooks.state.get(path);
    if (!currentHooks) {
      return;
    }

    const prevState = currentHooks[cursor];
    const newState = typeof nextValue === "function" ? (nextValue as (prev: T) => T)(prevState) : nextValue;

    // Object.is로 비교
    if (!Object.is(prevState, newState)) {
      currentHooks[cursor] = newState;
      enqueueRender();
    }
  };

  // 커서 증가
  hooks.cursor.set(path, cursor + 1);

  return [state, setState];
};

/**
 * 컴포넌트의 사이드 이펙트를 처리하기 위한 훅입니다.
 * @param effect - 실행할 이펙트 함수. 클린업 함수를 반환할 수 있습니다.
 * @param deps - 의존성 배열. 이 값들이 변경될 때만 이펙트가 다시 실행됩니다.
 */
export const useEffect = (effect: () => (() => void) | void, deps?: unknown[]): void => {
  // 여기를 구현하세요.
  // 1. 이전 훅의 의존성 배열과 현재 의존성 배열을 비교(shallowEquals)합니다.
  // 2. 의존성이 변경되었거나 첫 렌더링일 경우, 이펙트 실행을 예약합니다.
  // 3. 이펙트 실행 전, 이전 클린업 함수가 있다면 먼저 실행합니다.
  // 4. 예약된 이펙트는 렌더링이 끝난 후 비동기로 실행됩니다.

  const { hooks, effects } = context;
  const path = hooks.currentPath;
  const cursor = hooks.currentCursor;
  const hookState = hooks.currentHooks;

  // 이전 훅 가져오기
  const prevHook: EffectHook | undefined = hookState[cursor];

  // 의존성 비교
  // !prevHook - 첫 렌더링 (이전 훅 없음)
  // !prevHook.deps - 이전에 의존성이 없었음
  // !deps - 지금 의존성이 없음 (매번 실행)
  // !shallowEquals(prevHook.deps, deps) - 의존성이 변경됨
  const hasChanged = !prevHook || !prevHook.deps || !deps || !shallowEquals(prevHook.deps, deps);

  // 현재 훅 생성 또는 업데이트
  const currentHook: EffectHook = {
    kind: HookTypes.EFFECT,
    deps: deps ?? null,
    cleanup: prevHook?.cleanup ?? null,
    effect,
  };

  if (cursor >= hookState.length) {
    hookState.push(currentHook);
  } else {
    hookState[cursor] = currentHook;
  }

  // 의존성이 변경되었으면 이펙트 실행 예약
  if (hasChanged) {
    effects.queue.push({ path, cursor });
  }

  // 커서 증가
  hooks.cursor.set(path, cursor + 1);
};
