import { context } from "./context";
import { reconcile } from "./reconciler";
import { cleanupUnusedHooks, flushEffects } from "./hooks";
import { withEnqueue } from "../utils";

/**
 * 루트 컴포넌트의 렌더링을 수행하는 함수입니다.
 * `enqueueRender`에 의해 스케줄링되어 호출됩니다.
 */
export const render = (): void => {
  const { container, node, instance } = context.root;

  if (!container || !node) {
    return;
  }

  // 훅 컨텍스트 visited 초기화
  context.hooks.visited.clear();

  // reconcile 수행
  const newInstance = reconcile(container, instance, node, "0");

  // 새 인스턴스를 루트에 저장
  context.root.instance = newInstance;

  // 사용되지 않은 훅 정리
  cleanupUnusedHooks();

  // 이펙트 실행
  flushEffects();
};

/**
 * `render` 함수를 마이크로태스크 큐에 추가하여 중복 실행을 방지합니다.
 */
export const enqueueRender = withEnqueue(render);
