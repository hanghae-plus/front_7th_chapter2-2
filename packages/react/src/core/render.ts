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
  // 여기를 구현하세요.
  // 1. 훅 컨텍스트를 초기화합니다.
  context.hooks.clear();
  // 2. reconcile 함수를 호출하여 루트 노드를 재조정합니다.
  const oldInstance = context.root.instance;
  const newInstance = reconcile(context.root.container as HTMLElement, oldInstance, context.root.node, ROOT_PATH);

  context.root.instance = newInstance;

  // if (!oldInstance) {
  //   insertInstance(context.root.container as HTMLElement, newInstance);
  // }
  context.domEffects.commit();

  // 3. 사용되지 않은 훅들을 정리(cleanupUnusedHooks)합니다.
  cleanupUnusedHooks();

  // 4. 이펙트를 실행
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
