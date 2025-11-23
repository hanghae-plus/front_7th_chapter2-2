// 이벤트 핸들러를 저장할 중앙 레지스트리
// WeakMap<Element, Map<EventType, Set<Handler>>>
const eventRegistry = new WeakMap();

// 지원할 이벤트 타입 목록
const supportedEvents = new Set();

/**
 * 이벤트 위임을 처리할 최상위 리스너
 * @param {Event} e
 */
function dispatchEvent(e) {
  const eventType = e.type;
  let currentTarget = e.target;

  // 이벤트 버블링을 흉내내며 상위 요소로 이동
  while (currentTarget) {
    // 현재 요소에 대한 이벤트 맵 가져오기
    const eventMap = eventRegistry.get(currentTarget);
    if (eventMap) {
      // 현재 이벤트 타입에 대한 핸들러 Set 가져오기
      const handlers = eventMap.get(eventType);
      if (handlers) {
        // 모든 핸들러 실행
        handlers.forEach((handler) => handler(e));
      }
    }

    // 이벤트가 상위로 전파되는 것을 멈추면 루프 종료
    if (e.bubbles === false || e.cancelBubble) {
      break;
    }

    // 부모 요소로 이동
    currentTarget = currentTarget.parentElement;
  }
}

/**
 * 루트 요소에 이벤트 리스너를 설정합니다.
 * 이 함수는 애플리케이션 초기화 시 한 번만 호출되어야 합니다.
 * @param {HTMLElement} root - 이벤트 리스너를 부착할 최상위 요소
 */
export function setupEventListeners(root) {
  supportedEvents.forEach((eventType) => {
    // 이미 리스너가 등록된 경우 중복 등록 방지
    if (
      !root.dataset.eventSetup ||
      !root.dataset.eventSetup.includes(eventType)
    ) {
      // 버블링 단계에서 처리하도록 수정 (세 번째 인자 제거)
      root.addEventListener(eventType, dispatchEvent);
      root.dataset.eventSetup = `${root.dataset.eventSetup || ""} ${eventType}`;
    }
  });
}

/**
 * 요소에 이벤트 핸들러를 등록합니다.
 * @param {HTMLElement} element - 이벤트를 등록할 요소
 * @param {string} eventType - 이벤트 타입 (e.g., 'click')
 * @param {Function} handler - 실행할 이벤트 핸들러
 */
export function addEvent(element, eventType, handler) {
  // 지원하는 이벤트 목록에 추가
  supportedEvents.add(eventType);

  // 요소에 대한 이벤트 맵 가져오기 (없으면 생성)
  let eventMap = eventRegistry.get(element);
  if (!eventMap) {
    eventMap = new Map();
    eventRegistry.set(element, eventMap);
  }

  // 이벤트 타입에 대한 핸들러 Set 가져오기 (없으면 생성)
  let handlers = eventMap.get(eventType);
  if (!handlers) {
    handlers = new Set();
    eventMap.set(eventType, handlers);
  }

  // 핸들러 추가
  handlers.add(handler);
}

/**
 * 요소에서 이벤트 핸들러를 제거합니다.
 * @param {HTMLElement} element - 이벤트가 등록된 요소
 * @param {string} eventType - 이벤트 타입
 * @param {Function} handler - 제거할 이벤트 핸들러
 */
export function removeEvent(element, eventType, handler) {
  const eventMap = eventRegistry.get(element);
  if (!eventMap) return;

  const handlers = eventMap.get(eventType);
  if (!handlers) return;

  handlers.delete(handler);

  // 핸들러 Set이 비면 Map에서 제거
  if (handlers.size === 0) {
    eventMap.delete(eventType);
  }

  // 이벤트 Map이 비면 WeakMap에서 제거
  if (eventMap.size === 0) {
    eventRegistry.delete(element);
  }
}
