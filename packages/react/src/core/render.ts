import { context } from "./context";
// import { getDomNodes, insertInstance } from "./dom";
import { reconcile } from "./reconciler";
import { cleanupUnusedHooks } from "./hooks";
import { withEnqueue } from "../utils";

/**
 * 루트 컴포넌트의 렌더링을 수행하는 함수입니다.
 * `enqueueRender`에 의해 스케줄링되어 호출됩니다.
 * 1. 훅 컨텍스트를 초기화합니다.
 * 2. reconcile 함수를 호출하여 루트 노드를 재조정합니다.
 * 3. 사용되지 않은 훅들을 정리(cleanupUnusedHooks)합니다.
 */
export const render = (): void => {
  // 1. 훅 방문 기록 초기화
  context.hooks.visited.clear();

  // 2. 이전 인스턴스 가져오기
  const oldInstance = context.root.instance;

  // 3. 루트 노드 재조정
  const newInstance = reconcile(
    context.root.container as HTMLElement, // parentDom
    oldInstance, // instance (이전)
    context.root.node, // node (새로운)
    "", // path (루트)
  );

  // 4. 새 인스턴스 저장
  context.root.instance = newInstance;

  // 5. 사용되지 않은 훅들을 정리
  cleanupUnusedHooks();

  // 6. 대기 중인 effect를 비동기로 실행 (microtask queue)
  queueMicrotask(() => flushEffects());
};

/**
 * 대기 중인 모든 effect 실행
 */
const flushEffects = (): void => {
  const { effects } = context;
  const queue = effects.queue.slice(); // 복사
  effects.queue = []; // 초기화

  for (const effect of queue) {
    effect();
  }
};

/**
 * `render` 함수를 마이크로태스크 큐에 추가하여 중복 실행을 방지합니다.
 */
export const enqueueRender = withEnqueue(render);
