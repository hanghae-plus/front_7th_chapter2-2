import { context } from "./context";
import { getDomNodes, insertInstance } from "./dom";
import { createChildPath } from "./elements";
import { reconcile } from "./reconciler";
import { cleanupUnusedHooks } from "./hooks";
import { enqueue, withEnqueue } from "../utils";
import { EffectHook } from "./types";

const ROOT_PATH = "root";

/**
 * 루트 컴포넌트의 렌더링을 수행하는 함수입니다.
 * `enqueueRender`에 의해 스케줄링되어 호출됩니다.
 */
export const render = (): void => {
  // hooks clear
  context.hooks.clear();
  context.hooks.visited.clear();

  // reconcile
  const oldInstance = context.root.instance;
  const newInstance = reconcile(context.root.container as HTMLElement, oldInstance, context.root.node, ROOT_PATH);
  context.root.instance = newInstance;

  // domEffects commit
  context.domEffects.commit();

  // cleanupUnusedHooks
  cleanupUnusedHooks();

  // executeEffects
  enqueue(executeEffects);
};

/**
 * `render` 함수를 마이크로태스크 큐에 추가하여 중복 실행을 방지합니다.
 */
export const enqueueRender = withEnqueue(render);

const executeEffects = () => {
  const effectQueue = context.effects.queue;

  const effectQueueToExecute: EffectHook[] = [];

  for (const { path, cursor } of effectQueue) {
    const allEffects = context.hooks.effect.get(path) ?? [];
    if (allEffects && allEffects[cursor]) effectQueueToExecute.push(allEffects[cursor]);
  }

  for (const effect of effectQueueToExecute) {
    if (effect.cleanup) effect.cleanup();

    const newCleanup = effect.effect();
    if (newCleanup) effect.cleanup = newCleanup;
  }

  context.effects.queue = [];
};
