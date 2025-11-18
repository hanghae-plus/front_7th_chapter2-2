import { context } from "./context";
// import { getDomNodes, insertInstance } from "./dom";
import { reconcile } from "./reconciler";
import { cleanupUnusedHooks } from "./hooks";
import { withEnqueue } from "../utils";

/**
 * 루트 컴포넌트의 렌더링을 수행하는 함수입니다.
 * `enqueueRender`에 의해 스케줄링되어 호출됩니다.
 */
export const render = (): void => {
  // 여기를 구현하세요.
  // 1. 훅 컨텍스트를 초기화합니다.
  // (state는 유지하고 cursor와 visited만 초기화)
  context.hooks.cursor.clear();
  context.hooks.visited.clear();
  context.hooks.componentStack = [];
  // 2. reconcile 함수를 호출하여 루트 노드를 재조정합니다.
  context.root.instance = reconcile(context.root.container!, context.root.instance, context.root.node, "");
  // 3. 사용되지 않은 훅들을 정리(cleanupUnusedHooks)합니다.
  cleanupUnusedHooks();

  // 4. 렌더링 완료 후 이펙트를 비동기로 실행합니다.
  const effectsToRun = [...context.effects.queue];
  context.effects.queue = [];

  if (effectsToRun.length > 0) {
    queueMicrotask(() => {
      effectsToRun.forEach(({ path, cursor }) => {
        const hookState = context.hooks.state.get(path);
        if (hookState && hookState[cursor]) {
          const hook = hookState[cursor];
          if (typeof hook === "object" && hook !== null && "effect" in hook) {
            // 이전 클린업 함수 실행
            if (hook.cleanup) {
              hook.cleanup();
            }
            // 새 이펙트 실행 및 클린업 함수 저장
            const cleanup = hook.effect();
            hook.cleanup = cleanup || null;
          }
        }
      });
    });
  }
};

/**
 * `render` 함수를 마이크로태스크 큐에 추가하여 중복 실행을 방지합니다.
 */
export const enqueueRender = withEnqueue(render);
