import { context } from "./context";
import { reconcile } from "./reconciler";
import { cleanupUnusedHooks, flushEffects } from "./hooks";
import { withEnqueue } from "../utils";

/**
 * 루트 컴포넌트의 렌더링을 수행하는 함수입니다.
 * `enqueueRender`에 의해 스케줄링되어 호출됩니다.
 */
export const render = (): void => {
  const root = context.root;
  const { container, instance, node } = root;

  if (!container || !node) return;

  // visited를 초기화하여 이번 렌더링에서 방문한 컴포넌트를 추적합니다.
  context.hooks.visited.clear();

  // reconcile 함수를 호출하여 루트 노드를 재조정합니다.
  const newInstance = reconcile(container, instance, node, "");
  root.instance = newInstance;

  // 사용되지 않은 훅들을 정리합니다.
  cleanupUnusedHooks();

  // 이펙트를 실행합니다.
  flushEffects();
};

/**
 * `render` 함수를 마이크로태스크 큐에 추가하여 중복 실행을 방지합니다.
 */
export const enqueueRender = withEnqueue(render);
