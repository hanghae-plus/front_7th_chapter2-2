import { shallowEquals } from "../utils";
import { context } from "./context";
import { enqueueRender } from "./render";
import { HookTypes } from "./constants";

// import { withEnqueue } from "../utils";
// import { EffectHook } from "./types";
// import { HookTypes } from "./constants";

/**
 * 사용되지 않는 컴포넌트의 훅 상태와 이펙트 클린업 함수를 정리합니다.
 */
export const cleanupUnusedHooks = (): void => {
  const { hooks } = context;
  const paths = Array.from(hooks.state.keys());

  for (const path of paths) {
    if (!hooks.visited.has(path)) {
      hooks.state.delete(path);
      hooks.cursor.delete(path);
    }
  }
};

/**
 * 컴포넌트의 상태를 관리하기 위한 훅입니다.
 * @param initialValue - 초기 상태 값 또는 초기 상태를 반환하는 함수
 * @returns [현재 상태, 상태를 업데이트하는 함수]
 * 여기를 구현하세요.
 * 1. 현재 컴포넌트의 훅 커서와 상태 배열을 가져옵니다.
 * 2. 첫 렌더링이라면 초기값으로 상태를 설정합니다.
 * 3. 상태 변경 함수(setter)를 생성합니다.
 *    - 새 값이 이전 값과 같으면(Object.is) 재렌더링을 건너뜁니다.
 *    - 값이 다르면 상태를 업데이트하고 재렌더링을 예약(enqueueRender)합니다.
 * 4. 훅 커서를 증가시키고 [상태, setter]를 반환합니다.
 */
export const useState = <T>(initialValue: T | (() => T)): [T, (nextValue: T | ((prev: T) => T)) => void] => {
  /* 1. 컴포넌트 정보 파악하기 */
  /* 1-1. 전역 Hook 저장소 가져오기 */
  const { hooks } = context;

  /* 1-2. 현재 실행중인 컴포넌트 경로 가져오기 */
  const path = hooks.currentPath;

  /* 1-3. 현재 실행중인 컴포넌트 커서 가져오기 (몇 번째 useState 인지) */
  const cursor = hooks.currentCursor;

  /* 1-4. 현재 실행중인 컴포넌트 훅 배열 가져오기 (훅 상태 배열) */
  const hookList = hooks.currentHooks;

  /* 2. 첫 렌더링인가 VS 이미 렌더링 된 상태인가 판단하기 */
  /* 2-1. 이 위치에 훅이 없거나 잘못된 타입이면 초기값 설정 */
  if (hookList[cursor] === undefined || !("value" in hookList[cursor])) {
    /* 2-2. 초기값이 함수면 실행하고, 아니면 그대로 설정 */
    const value = typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;

    /* 2-3. 현재 훅 상태 배열에 초기값 설정 */
    hookList[cursor] = { value };
  }

  /* 3. 저장된 내 훅 상태 가져오기 */
  const hook = hookList[cursor];

  /* 4. 값 바꾸는 함수 만들기 */
  const setState = (newValue: T | ((prev: T) => T)) => {
    /* 4-1. 새 값이 함수면 이전 값을 인자로 호출하고, 아니면 그대로 설정 */
    const nextValue = typeof newValue === "function" ? (newValue as (prev: T) => T)(hook.value) : newValue;

    /* 4-2. 값이 변경되었을 때만 리렌더링 */
    if (!Object.is(hook.value, nextValue)) {
      hook.value = nextValue;
      /* 4-3. 재렌더링 예약 */
      enqueueRender();
    }
  };

  /* 5. 훅 커서를 증가시키고 [상태, setter]를 반환 */
  hooks.cursor.set(path, cursor + 1);

  /* 6. [상태, setter]를 반환 */
  return [hook.value, setState];
};

/**
 * 컴포넌트의 사이드 이펙트를 처리하기 위한 훅입니다.
 * @param effect - 실행할 이펙트 함수. 클린업 함수를 반환할 수 있습니다.
 * @param deps - 의존성 배열. 이 값들이 변경될 때만 이펙트가 다시 실행됩니다.
 */
export const useEffect = (effect: () => (() => void) | void, deps?: unknown[]): void => {
  /* 1. 컴포넌트 정보 파악하기 */
  /* 1-1. 전역 Hook 저장소와 Effect 큐 가져오기 */
  const { hooks, effects } = context;

  /* 1-2. 현재 실행중인 컴포넌트 경로 가져오기 */
  const path = hooks.currentPath;

  /* 1-3. 현재 실행중인 컴포넌트 커서 가져오기 (몇 번째 useEffect 인지) */
  const cursor = hooks.currentCursor;

  /* 1-4. 현재 실행중인 컴포넌트 훅 배열 가져오기 */
  const hookList = hooks.currentHooks;

  /* 2. 이전에 실행했었나? 이전 Hook 가져오기 */
  const prevHook = hookList[cursor];

  /* 3. 실행해야 하나? deps 비교하기 */
  /* 3-1. 기본값: 일단 실행한다고 가정 (deps 없으면 매번 실행) */
  let hasChanged = true;

  /* 3-2. 이전 Hook이 있고 deps가 주어졌을 때 비교 */
  if (prevHook && deps !== undefined) {
    /* 3-3. 이전에도 deps가 있었다면 얕은 비교로 변경 확인 */
    if (prevHook.deps !== undefined) {
      hasChanged = !shallowEquals(prevHook.deps, deps);
    }
  }

  /* 3-4. deps가 없으면 매번 실행 */
  if (deps === undefined) {
    hasChanged = true;
  }

  /* 4. 실행 예약하기 - Effect Queue에 추가 */
  if (hasChanged) {
    /* 4-1. 이전 cleanup 함수가 있으면 먼저 실행 예약 */
    if (prevHook?.cleanup) {
      effects.queue.push(prevHook.cleanup);
    }

    /* 4-2. 새 effect 실행 예약 */
    effects.queue.push(() => {
      /* 4-2-1. effect 실행 (cleanup 함수를 반환할 수 있음) */
      const cleanup = effect();

      /* 4-2-2. cleanup 함수가 반환되었으면 저장 */
      if (typeof cleanup === "function") {
        const currentHookList = hooks.state.get(path);
        if (currentHookList && currentHookList[cursor]) {
          currentHookList[cursor].cleanup = cleanup;
        }
      }
    });
  }

  /* 5. 정보 저장하기 - 현재 deps와 cleanup 저장 */
  hookList[cursor] = {
    kind: HookTypes.EFFECT, // Hook 타입 명시
    deps: deps,
    cleanup: prevHook?.cleanup,
  };

  /* 6. 다음 Hook 준비 - 커서 증가 */
  hooks.cursor.set(path, cursor + 1);
};
