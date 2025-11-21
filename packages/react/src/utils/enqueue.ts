import type { AnyFunction } from "../types";

/**
 * 작업을 마이크로태스크 큐에 추가하여 비동기적으로 실행합니다.
 * 브라우저의 `queueMicrotask` 또는 `Promise.resolve().then()`을 사용합니다.
 */
export const enqueue = (callback: () => void) => {
  // 마이크로태스크 큐에 콜백 추가
  queueMicrotask(callback);
};

/**
 * 함수가 여러 번 호출되더라도 실제 실행은 한 번만 스케줄링되도록 보장하는 고차 함수입니다.
 * 렌더링이나 이펙트 실행과 같은 작업의 중복을 방지하는 데 사용됩니다.
 * scheduled 플래그를 사용하여 fn이 한 번만 예약되도록 구현
 */
export const withEnqueue = (fn: AnyFunction) => {
  // 스케줄링 여부를 추적하는 플래그 (클로저로 유지)
  let scheduled = false;

  return () => {
    // 이미 스케줄링되어 있으면 무시
    if (!scheduled) {
      // 스케줄링 플래그 설정
      scheduled = true;

      // 마이크로태스크로 예약
      enqueue(() => {
        // 실행 전 플래그 리셋 (다음 호출을 위해)
        scheduled = false;
        // 실제 함수 실행
        fn();
      });
    }
  };
};
