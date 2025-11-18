import { withEnqueue } from "../utils";
import { context } from "./context";
import { getDomNodes, insertInstance } from "./dom";
import { cleanupUnusedHooks } from "./hooks";
import { reconcile } from "./reconciler";

/**
 * 루트 컴포넌트의 렌더링을 수행하는 함수입니다.
 * `enqueueRender`에 의해 스케줄링되어 호출됩니다.
 */
export const render = (): void => {
  // 1. 훅 컨텍스트를 초기화합니다.
  //    렌더링 시작 시 방문 기록과 커서를 초기화하여 새로운 렌더링에서
  //    어떤 컴포넌트가 방문되었는지 추적할 수 있도록 합니다.
  context.hooks.visited.clear();
  context.hooks.cursor.clear();

  // 2. reconcile 함수를 호출하여 루트 노드를 재조정합니다.
  const { container, node, instance } = context.root;
  if (!container || !node) return;

  const newInstance = reconcile(container, instance, node, "0");
  context.root.instance = newInstance;

  // reconcile 후 생성된 인스턴스의 DOM 노드들을 확인하고 필요하면 컨테이너에 삽입합니다.
  if (newInstance) {
    const domNodes = getDomNodes(newInstance);
    // 실제로 컨테이너에 없는 노드가 있는지 확인합니다.
    if (domNodes.some((node) => node && node.parentNode !== container)) insertInstance(container, newInstance);
  }

  // 3. 사용되지 않은 훅들을 정리(cleanupUnusedHooks)합니다.
  cleanupUnusedHooks();
};

/**
 * `render` 함수를 마이크로태스크 큐에 추가하여 중복 실행을 방지합니다.
 */
export const enqueueRender = withEnqueue(render);
