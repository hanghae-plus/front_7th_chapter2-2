// 이벤트 핸들러 저장: element -> Map(eventType -> Set(handlers))
const eventHandlersMap = new WeakMap();

// 전역 이벤트 타입별 핸들러 카운트 추적
const eventTypeCounts = new Map();

// root별로 등록된 이벤트 리스너 추적
const rootEventListeners = new WeakMap();

// 등록된 root 요소들 추적
const registeredRoots = new Set();

export function setupEventListeners(root) {
  if (!rootEventListeners.has(root)) {
    rootEventListeners.set(root, new Map());
    registeredRoots.add(root);
  }

  const rootListeners = rootEventListeners.get(root);

  // 현재 사용중인 모든 이벤트 타입에 대해 리스너 등록
  eventTypeCounts.forEach((count, eventType) => {
    if (count > 0 && !rootListeners.has(eventType)) {
      const listener = createEventListener(root, eventType);
      root.addEventListener(eventType, listener);
      rootListeners.set(eventType, listener);
    }
  });
}

function createEventListener(root, eventType) {
  return (event) => {
    let target = event.target;
    let propagationStopped = false;

    // stopPropagation을 감지하기 위한 래퍼
    const originalStopPropagation = event.stopPropagation;
    event.stopPropagation = function () {
      propagationStopped = true;
      originalStopPropagation.call(event);
    };

    // target에서 root까지 버블링 (root 포함)
    while (target && !propagationStopped) {
      const elementHandlers = eventHandlersMap.get(target);

      if (elementHandlers) {
        const handlers = elementHandlers.get(eventType);
        if (handlers) {
          handlers.forEach((handler) => {
            if (!propagationStopped) {
              handler.call(target, event);
            }
          });
        }
      }

      // root에 도달하면 종료
      if (target === root) {
        break;
      }

      target = target.parentElement;
    }

    // 원래 stopPropagation 복원
    event.stopPropagation = originalStopPropagation;
  };
}

export function addEvent(element, eventType, handler) {
  // 핸들러 저장
  if (!eventHandlersMap.has(element)) {
    eventHandlersMap.set(element, new Map());
  }

  const elementHandlers = eventHandlersMap.get(element);

  if (!elementHandlers.has(eventType)) {
    elementHandlers.set(eventType, new Set());
  }

  const handlers = elementHandlers.get(eventType);
  const isNewHandler = !handlers.has(handler);
  handlers.add(handler);

  if (isNewHandler) {
    const currentCount = eventTypeCounts.get(eventType) || 0;
    eventTypeCounts.set(eventType, currentCount + 1);

    // 새로운 이벤트 타입이면 모든 root에 리스너 추가
    if (currentCount === 0) {
      registeredRoots.forEach((root) => {
        const rootListeners = rootEventListeners.get(root);
        if (rootListeners && !rootListeners.has(eventType)) {
          const listener = createEventListener(root, eventType);
          root.addEventListener(eventType, listener);
          rootListeners.set(eventType, listener);
        }
      });
    }
  }
}

export function removeEvent(element, eventType, handler) {
  const elementHandlers = eventHandlersMap.get(element);

  if (!elementHandlers) {
    return;
  }

  const handlers = elementHandlers.get(eventType);

  if (!handlers || !handlers.has(handler)) {
    return;
  }

  // 핸들러 제거
  handlers.delete(handler);

  // 이 이벤트 타입의 전역 카운트 감소
  const currentCount = eventTypeCounts.get(eventType) || 0;
  if (currentCount > 0) {
    eventTypeCounts.set(eventType, currentCount - 1);

    // 더 이상 핸들러가 없으면 root 리스너도 제거
    if (currentCount === 1) {
      registeredRoots.forEach((root) => {
        const rootListeners = rootEventListeners.get(root);
        if (rootListeners && rootListeners.has(eventType)) {
          const listener = rootListeners.get(eventType);
          root.removeEventListener(eventType, listener);
          rootListeners.delete(eventType);
        }
      });
      eventTypeCounts.delete(eventType);
    }
  }

  // 빈 컬렉션 정리
  if (handlers.size === 0) {
    elementHandlers.delete(eventType);
  }

  if (elementHandlers.size === 0) {
    eventHandlersMap.delete(element);
  }
}
