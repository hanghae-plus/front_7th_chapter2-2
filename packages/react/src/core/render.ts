import { context } from "./context";
// import { getDomNodes, insertInstance } from "./dom";
import { reconcile } from "./reconciler";
import { cleanupUnusedHooks } from "./hooks";
import { enqueue, withEnqueue } from "../utils";
import { EffectHook } from "./types";
import { HookTypes } from "./constants";

/**
 * 루트 컴포넌트의 렌더링을 수행하는 함수입니다.
 * `enqueueRender`에 의해 스케줄링되어 호출됩니다.
 */
export const render = (): void => {
  // 여기를 구현하세요.
  // 1. 훅 컨텍스트를 초기화합니다.
  context.hooks.visited.clear();

  // 2. reconcile 함수를 호출하여 루트 노드를 재조정합니다.
  const newInstance = reconcile(context.root.container!, context.root.instance, context.root.node, "0");
  context.root.instance = newInstance;

  // 3. 사용되지 않은 훅들을 정리(cleanupUnusedHooks)합니다.
  cleanupUnusedHooks();

  flushEffects();
};

function flushEffects() {
  const effectsToRun = [...context.effects.queue];
  context.effects.queue = [];

  effectsToRun.forEach(({ path, cursor }) => {
    const hooks = context.hooks.state.get(path);
    if (!hooks) return;

    const effectHook = hooks[cursor] as EffectHook;
    if (!effectHook || effectHook.kind !== HookTypes.EFFECT) return;

    // cleanup 먼저 실행
    if (effectHook.cleanup) {
      effectHook.cleanup();
      effectHook.cleanup = null;
    }

    // effect 비동기 실행
    enqueue(() => {
      const cleanup = effectHook.effect();
      if (cleanup) {
        effectHook.cleanup = cleanup;
      }
    });
  });
}

/**
 * `render` 함수를 마이크로태스크 큐에 추가하여 중복 실행을 방지합니다.
 */
export const enqueueRender = withEnqueue(render);
