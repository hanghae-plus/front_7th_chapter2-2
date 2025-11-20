import type { AnyFunction } from "../types";

/**
 * 작업을 마이크로태스크 큐에 추가하여 비동기적으로 실행합니다.
 * 브라우저의 `queueMicrotask` 또는 `Promise.resolve().then()`을 사용합니다.
 */
export const enqueue = (callback: () => void) => {
  // queueMicrotask를 사용하여 콜백을 마이크로태스크 큐에 추가
  // 현재 실행 컨텍스트가 끝난 후, 다음 이벤트 루프 전에 실행됨
  // queueMicrotask가 없는 환경에서는 Promise를 사용
  if (typeof queueMicrotask === "function") {
    queueMicrotask(callback);
  } else {
    Promise.resolve().then(callback);
  }
};

/**
 * 함수가 여러 번 호출되더라도 실제 실행은 한 번만 스케줄링되도록 보장하는 고차 함수입니다.
 * 렌더링이나 이펙트 실행과 같은 작업의 중복을 방지하는 데 사용됩니다.
 */
export const withEnqueue = (fn: AnyFunction) => {
  // 스케줄링 상태를 추적하는 플래그
  let scheduled = false;

  return () => {
    // 이미 스케줄링되어 있으면 추가로 스케줄링하지 않음
    if (scheduled) {
      return;
    }

    // 스케줄링 플래그를 true로 설정
    scheduled = true;

    // 마이크로태스크 큐에 작업 추가
    enqueue(() => {
      // 실행 후 플래그를 다시 false로 설정하여 다음 스케줄링 가능하게 함
      scheduled = false;
      // 실제 함수 실행
      fn();
    });
  };
};
