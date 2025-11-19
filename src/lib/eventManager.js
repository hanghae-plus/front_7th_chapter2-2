// 요소별 이벤트 핸들러를 저장하는 WeakMap
const eventHandlers = new Map();

/**
 * 요소에 이벤트 핸들러 등록
 * @param {HTMLElement} element - 대상 요소
 * @param {string} eventType - 이벤트 타입 (click, change, input 등)
 * @param {Function} handler - 이벤트 핸들러 함수
 */
export function addEvent(element, eventType, handler) {
  const normalizedType = eventType.startsWith("on")
    ? eventType.slice(2).toLowerCase()
    : eventType.toLowerCase();

  if (normalizedType === "keydown") {
    // ✅ keydown만 로깅
    console.log(`[addEvent] type: ${normalizedType}, element:`, element);
  }

  if (!eventHandlers.has(element)) {
    eventHandlers.set(element, {});
  }

  const handlers = eventHandlers.get(element);

  if (!handlers[normalizedType]) {
    handlers[normalizedType] = [];
  }

  if (!handlers[normalizedType].includes(handler)) {
    handlers[normalizedType].push(handler);
    if (normalizedType === "keydown") {
      // ✅ keydown만 로깅
      console.log(
        `[addEvent] keydown 핸들러 등록 완료:`,
        handlers[normalizedType],
      );
    }
  }
}

/**
 * 요소에서 이벤트 핸들러 제거
 * @param {HTMLElement} element - 대상 요소
 * @param {string} eventType - 이벤트 타입
 * @param {Function} handler - 제거할 이벤트 핸들러
 */

export function removeEvent(element, eventType, handler) {
  // Step 1: 이벤트 타입 정규화
  const normalizedType = eventType.startsWith("on")
    ? eventType.slice(2).toLowerCase()
    : eventType.toLowerCase();

  // Step 2: 해당 요소의 핸들러 조회
  if (!eventHandlers.has(element)) {
    return;
  }

  const handlers = eventHandlers.get(element);
  if (!handlers[normalizedType]) {
    return;
  }

  // ✅ Step 3: handler가 전달된 경우 특정 핸들러만 제거
  if (handler) {
    handlers[normalizedType] = handlers[normalizedType].filter(
      (h) => h !== handler,
    );
  } else {
    // handler가 없으면 모든 핸들러 제거
    handlers[normalizedType] = [];
  }

  // Step 4: 핸들러 배열이 비어있으면 타입 자체를 삭제
  if (handlers[normalizedType].length === 0) {
    delete handlers[normalizedType];
  }

  // Step 5: 모든 이벤트 타입이 비어있으면 요소 자체를 삭제
  if (Object.keys(handlers).length === 0) {
    eventHandlers.delete(element);
  }
}

/**
 * 루트 요소에 이벤트 위임(Event Delegation) 설정
 * container의 모든 자식 요소에서 발생하는 이벤트를 위임 방식으로 처리
 * @param {HTMLElement} root - 루트 요소
 */
export function setupEventListeners(root) {
  if (!root) {
    return;
  }

  console.log(`[setupEventListeners] 시작, root:`, root);

  const eventTypes = [
    "click",
    "change",
    "input",
    "mouseover",
    "focus",
    "keydown",
  ];

  eventTypes.forEach((eventType) => {
    if (root._delegatedListeners && root._delegatedListeners[eventType]) {
      if (eventType === "keydown") {
        // ✅ keydown만 로깅
        console.log(`[setupEventListeners] ${eventType} 이미 등록됨`);
      }
      return;
    }

    const delegatedListener = (event) => {
      if (eventType === "keydown") {
        // ✅ keydown만 로깅
        console.log(
          `[delegatedListener] ${eventType} 이벤트 발생:`,
          event.target,
          eventHandlers,
        );
      }

      let target = event.target;
      while (target && target !== root) {
        if (eventHandlers.has(target)) {
          const handlers = eventHandlers.get(target);
          if (handlers[eventType]) {
            if (eventType === "keydown") {
              // ✅ keydown만 로깅
              console.log(
                `[delegatedListener] keydown 핸들러 실행:`,
                handlers[eventType].length,
              );
            }
            handlers[eventType].forEach((handler) => {
              handler(event);
            });
          }
        }
        target = target.parentNode;
      }
    };

    root.addEventListener(eventType, delegatedListener, false);

    if (eventType === "keydown") {
      // ✅ keydown만 로깅
      console.log(`[setupEventListeners] ${eventType} 위임 리스너 등록 완료`);
    }

    if (!root._delegatedListeners) {
      root._delegatedListeners = {};
    }
    root._delegatedListeners[eventType] = delegatedListener;
  });
}
