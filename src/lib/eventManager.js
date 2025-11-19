// 이벤트 핸들러를 저장하는 WeakMap
// element -> { eventType -> [handlers] }
const eventStore = new WeakMap();

/**
 * 루트 요소에 이벤트 리스너를 설정 (이벤트 위임)
 * @param {HTMLElement} root - 이벤트를 위임할 루트 요소
 */
export function setupEventListeners(root) {
  // 이미 설정된 경우 중복 설정 방지
  if (root.__eventDelegationSetup) return;
  root.__eventDelegationSetup = true;

  // 모든 이벤트 타입에 대해 위임 리스너 설정
  const eventTypes = [
    "click",
    "dblclick",
    "input",
    "change",
    "submit",
    "keydown",
    "keyup",
    "keypress",
    "mousedown",
    "mouseup",
    "mouseover",
    "mouseout",
    "mouseenter",
    "mouseleave",
    "focus",
    "blur",
  ];

  eventTypes.forEach((eventType) => {
    root.addEventListener(eventType, (event) => {
      // propagation이 중지되었는지 확인
      if (event.cancelBubble) return;

      let target = event.target;

      // 이벤트가 발생한 요소부터 루트까지 버블링하면서 핸들러 실행
      while (target && target !== root && target !== document) {
        // propagation이 중지되었는지 매번 확인
        if (event.cancelBubble) break;

        const handlers = eventStore.get(target)?.[eventType];
        if (handlers && handlers.length > 0) {
          // 핸들러를 복사해서 실행 중 변경되어도 안전하게 처리
          const handlersToRun = [...handlers];
          handlersToRun.forEach((handler) => {
            try {
              handler(event);
            } catch (error) {
              console.error(`Error in event handler for ${eventType}:`, error);
            }
          });
        }
        target = target.parentElement;
      }
    });
  });
}

/**
 * 요소에 이벤트 핸들러 추가
 * @param {HTMLElement} element - 이벤트를 추가할 요소
 * @param {string} eventType - 이벤트 타입 (예: 'click')
 * @param {Function} handler - 이벤트 핸들러 함수
 */
export function addEvent(element, eventType, handler) {
  if (!element || !eventType || typeof handler !== "function") {
    console.warn("addEvent: 잘못된 파라미터", { element, eventType, handler });
    return;
  }

  // 요소의 이벤트 스토어 가져오기 또는 생성
  let elementEvents = eventStore.get(element);
  if (!elementEvents) {
    elementEvents = {};
    eventStore.set(element, elementEvents);
  }

  // 이벤트 타입별 핸들러 배열 가져오기 또는 생성
  if (!elementEvents[eventType]) {
    elementEvents[eventType] = [];
  }

  // 핸들러 추가 (중복 방지)
  if (!elementEvents[eventType].includes(handler)) {
    elementEvents[eventType].push(handler);
  }
}

/**
 * 요소에서 이벤트 핸들러 제거
 * @param {HTMLElement} element - 이벤트를 제거할 요소
 * @param {string} eventType - 이벤트 타입 (예: 'click')
 * @param {Function} handler - 제거할 이벤트 핸들러 함수
 */
export function removeEvent(element, eventType, handler) {
  if (!element || !eventType || !handler) return;

  const elementEvents = eventStore.get(element);
  if (!elementEvents || !elementEvents[eventType]) return;

  // 핸들러 배열에서 제거
  const handlers = elementEvents[eventType];
  const index = handlers.indexOf(handler);
  if (index !== -1) {
    handlers.splice(index, 1);
  }

  // 핸들러가 없으면 이벤트 타입 삭제
  if (handlers.length === 0) {
    delete elementEvents[eventType];
  }

  // 이벤트가 없으면 요소에서 스토어 삭제
  if (Object.keys(elementEvents).length === 0) {
    eventStore.delete(element);
  }
}
