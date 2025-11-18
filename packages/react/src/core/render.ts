import { context } from "./context";
// import { getDomNodes, insertInstance } from "./dom";
import { reconcile } from "./reconciler";
import { cleanupUnusedHooks } from "./hooks";
import { withEnqueue, enqueue } from "../utils";

/**
 * 루트 컴포넌트의 렌더링을 수행하는 함수입니다.
 * `enqueueRender`에 의해 스케줄링되어 호출됩니다.
 */
export const render = (): void => {
  // 여기를 구현하세요.
  // 1. 훅 컨텍스트를 초기화합니다.
  // 2. reconcile 함수를 호출하여 루트 노드를 재조정합니다.
  // 3. 사용되지 않은 훅들을 정리(cleanupUnusedHooks)합니다.

  const { root, hooks, effects } = context;

  if (!root.container || !root.node) {
    return;
  }

  // 훅 컨텍스트 초기화 (커서만 초기화, state는 유지)
  hooks.cursor.clear();
  hooks.visited.clear();
  hooks.componentStack = [];

  // 이펙트 큐 초기화
  effects.queue = [];

  // 루트 노드 재조정
  root.instance = reconcile(root.container, root.instance, root.node, "root");

  // 사용되지 않은 훅 정리
  cleanupUnusedHooks();

  // 이펙트 실행
  enqueue(() => {
    for (const { path, cursor } of effects.queue) {
      const hookState = hooks.state.get(path);
      if (hookState && hookState[cursor]) {
        const effectHook = hookState[cursor];

        // 이전 클린업 함수 실행
        if (effectHook.cleanup) {
          effectHook.cleanup();
        }

        // 새 이펙트 실행
        const cleanup = effectHook.effect();
        if (cleanup) {
          effectHook.cleanup = cleanup;
        } else {
          effectHook.cleanup = null;
        }
      }
    }
  });
};

/**
 * `render` 함수를 마이크로태스크 큐에 추가하여 중복 실행을 방지합니다.
 */
export const enqueueRender = withEnqueue(render);
