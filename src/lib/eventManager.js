// 이벤트 핸들러 저장소
// key: element, value: Map<eventType, Set<handler>>
const eventHandlers = new WeakMap();

// 루트별로 등록된 이벤트 리스너 추적
const rootListeners = new WeakMap();

/**
 * 루트 컨테이너에 이벤트 위임 설정
 * 각 이벤트 타입별로 하나의 리스너만 등록
 */
export function setupEventListeners(root) {
  // 이미 설정된 경우 중복 등록 방지
  if (rootListeners.has(root)) {
    return;
  }

  const registeredListeners = new Set();

  // 이벤트 위임 핸들러 (버블링 단계에서만 처리)
  const handleEvent = (event) => {
    // stopPropagation이 호출되었는지 확인
    // event.cancelBubble은 stopPropagation 호출 시 true가 됨
    if (event.cancelBubble) {
      return;
    }

    let target = event.target;

    // 이벤트 버블링을 따라 올라가며 핸들러 찾기
    while (target && target !== root) {
      const handlers = eventHandlers.get(target);
      if (handlers) {
        const handlersForType = handlers.get(event.type);
        if (handlersForType && handlersForType.size > 0) {
          // 모든 핸들러 실행
          handlersForType.forEach((handler) => {
            handler(event);
          });
        }
      }
      target = target.parentElement;
    }
  };

  // 모든 이벤트 타입에 대해 리스너 등록
  // 실제로는 필요한 이벤트 타입만 등록하지만, 여기서는 일반적인 이벤트들을 등록
  const eventTypes = [
    "click",
    "change",
    "input",
    "submit",
    "focus",
    "blur",
    "keydown",
    "keyup",
    "keypress",
    "mousedown",
    "mouseup",
    "mousemove",
    "mouseover",
    "mouseout",
  ];

  eventTypes.forEach((eventType) => {
    root.addEventListener(eventType, handleEvent, false); // 버블링 단계에서만 처리
    registeredListeners.add({ type: eventType, handler: handleEvent });
  });

  rootListeners.set(root, registeredListeners);
}

/**
 * 요소에 이벤트 핸들러 등록
 */
export function addEvent(element, eventType, handler) {
  if (!eventHandlers.has(element)) {
    eventHandlers.set(element, new Map());
  }

  const handlers = eventHandlers.get(element);
  if (!handlers.has(eventType)) {
    handlers.set(eventType, new Set());
  }

  handlers.get(eventType).add(handler);
}

/**
 * 요소에서 이벤트 핸들러 제거
 */
export function removeEvent(element, eventType, handler) {
  const handlers = eventHandlers.get(element);
  if (!handlers) {
    return;
  }

  const handlersForType = handlers.get(eventType);
  if (!handlersForType) {
    return;
  }

  handlersForType.delete(handler);

  // 핸들러가 없으면 Set 제거
  if (handlersForType.size === 0) {
    handlers.delete(eventType);
  }

  // 이벤트 타입이 없으면 Map 제거
  if (handlers.size === 0) {
    eventHandlers.delete(element);
  }
}
