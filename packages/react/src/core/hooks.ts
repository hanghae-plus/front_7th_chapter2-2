import { shallowEquals, withEnqueue } from "../utils";
import { context } from "./context";
import { EffectHook } from "./types";
import { enqueueRender } from "./render";
import { HookTypes } from "./constants";

/**
 * 사용되지 않는 컴포넌트의 훅 상태와 이펙트 클린업 함수를 정리합니다.
 */
export const cleanupUnusedHooks = () => {
  // visited에 없는 경로의 훅 상태를 정리
  const pathsToDelete: string[] = [];

  context.hooks.state.forEach((_, path) => {
    if (!context.hooks.visited.has(path)) {
      // cleanup 함수 실행
      const hooks = context.hooks.state.get(path);
      if (hooks) {
        hooks.forEach((hook) => {
          if (hook && hook.kind === HookTypes.EFFECT && hook.cleanup) {
            hook.cleanup();
          }
        });
      }

      pathsToDelete.push(path);
    }
  });

  // 상태 제거
  pathsToDelete.forEach((path) => {
    context.hooks.state.delete(path);
    context.hooks.cursor.delete(path);
  });

  // visited 초기화 (다음 렌더를 위해)
  context.hooks.visited.clear();
};

/**
 * 컴포넌트의 상태를 관리하기 위한 훅입니다.
 * @param initialValue - 초기 상태 값 또는 초기 상태를 반환하는 함수
 * @returns [현재 상태, 상태를 업데이트하는 함수]
 */
export const useState = <T>(initialValue: T | (() => T)): [T, (nextValue: T | ((prev: T) => T)) => void] => {
  // 현재 컴포넌트의 경로와 커서 가져오기
  const path = context.hooks.currentPath;
  const cursor = context.hooks.currentCursor;
  const hooks = context.hooks.currentHooks;

  // 첫 렌더링인 경우 초기값 설정
  if (cursor >= hooks.length) {
    const value = typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
    hooks.push(value);
  }

  // 현재 상태 가져오기
  const currentState = hooks[cursor];

  // setState 함수 생성 (path와 cursor를 클로저로 캡처)
  const capturedPath = path;
  const capturedCursor = cursor;

  const setState = (nextValue: T | ((prev: T) => T)) => {
    const hooks = context.hooks.state.get(capturedPath);
    if (!hooks) return;

    // 새 값 계산
    const newValue = typeof nextValue === "function" ? (nextValue as (prev: T) => T)(hooks[capturedCursor]) : nextValue;

    // 값이 같으면 재렌더링 건너뛰기
    if (Object.is(hooks[capturedCursor], newValue)) {
      return;
    }

    // 상태 업데이트
    hooks[capturedCursor] = newValue;

    // 재렌더링 예약
    enqueueRender();
  };

  // 커서 증가
  context.hooks.cursor.set(path, cursor + 1);

  return [currentState, setState];
};

/**
 * 컴포넌트의 사이드 이펙트를 처리하기 위한 훅입니다.
 * @param effect - 실행할 이펙트 함수. 클린업 함수를 반환할 수 있습니다.
 * @param deps - 의존성 배열. 이 값들이 변경될 때만 이펙트가 다시 실행됩니다.
 */
export const useEffect = (effect: () => (() => void) | void, deps?: unknown[]): void => {
  // 현재 컴포넌트의 경로와 커서 가져오기
  const path = context.hooks.currentPath;
  const cursor = context.hooks.currentCursor;
  const hooks = context.hooks.currentHooks;

  // 이전 effect 훅 가져오기
  const prevHook: EffectHook | undefined = hooks[cursor];

  // 의존성 비교
  let shouldRunEffect = false;

  if (!prevHook) {
    // 첫 렌더링이면 무조건 실행
    shouldRunEffect = true;
  } else if (!deps) {
    // deps가 없으면 매 렌더링마다 실행
    shouldRunEffect = true;
  } else if (!prevHook.deps) {
    // 이전에 deps가 없었으면 실행
    shouldRunEffect = true;
  } else {
    // deps를 얕은 비교
    shouldRunEffect = !shallowEquals(prevHook.deps, deps);
  }

  // 새 훅 정보 저장
  const newHook: EffectHook = {
    kind: HookTypes.EFFECT,
    deps: deps ? [...deps] : null,
    cleanup: prevHook?.cleanup || null,
    effect,
  };

  hooks[cursor] = newHook;

  // 이펙트 실행 예약
  if (shouldRunEffect) {
    context.effects.queue.push({ path, cursor });
  }

  // 커서 증가
  context.hooks.cursor.set(path, cursor + 1);
};

/**
 * 큐에 있는 모든 이펙트를 실행합니다.
 */
export const flushEffects = withEnqueue(() => {
  const queue = context.effects.queue.slice();
  context.effects.queue = [];

  queue.forEach(({ path, cursor }) => {
    const hooks = context.hooks.state.get(path);
    if (!hooks) return;

    const hook = hooks[cursor] as EffectHook | undefined;
    if (!hook || hook.kind !== HookTypes.EFFECT) return;

    // 이전 cleanup 실행
    if (hook.cleanup) {
      hook.cleanup();
      hook.cleanup = null;
    }

    // 새 effect 실행
    const cleanup = hook.effect();
    if (typeof cleanup === "function") {
      hook.cleanup = cleanup;
    }
  });
});
