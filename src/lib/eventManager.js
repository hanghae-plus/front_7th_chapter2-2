const eventListeners = new Map();
const rootEventHandlers = new Map(); // root에 등록된 이벤트 핸들러 추적

// root요소에 이벤트 리스너를 등록
export function setupEventListeners(root) {
  // 기존 이벤트 리스너 제거
  rootEventHandlers.forEach((handler, eventType) => {
    root.removeEventListener(eventType, handler);
  });
  rootEventHandlers.clear();

  // DOM에 존재하지 않는 요소의 이벤트 리스너 정리
  const elementsToRemove = [];
  eventListeners.forEach((listeners, element) => {
    // 요소가 DOM에 존재하지 않거나 root의 하위 요소가 아니면 제거
    if (!root.contains(element) && element !== root) {
      elementsToRemove.push(element);
    }
  });
  elementsToRemove.forEach((element) => {
    eventListeners.delete(element);
  });

  // eventType 가져오기, 중복된 이벤트 타입은 제거
  const eventTypes = new Set();
  eventListeners.forEach((listeners) => {
    listeners.forEach(({ eventType }) => {
      eventTypes.add(eventType);
    });
  });

  // eventType 마다 이벤트 리스너 등록
  eventTypes.forEach((eventType) => {
    const handler = (event) => {
      const $target = event.target;
      eventListeners.forEach((listeners, element) => {
        // 이벤트 위임: target이 element이거나 element의 하위 요소인지 확인
        if (element.contains($target) || $target === element) {
          listeners
            .filter((listener) => listener.eventType === eventType)
            .forEach((listener) => listener.handler(event));
        }
      });
    };
    root.addEventListener(eventType, handler);
    rootEventHandlers.set(eventType, handler); // 핸들러 저장
  });
}

export function addEvent(element, eventType, handler) {
  // element가 dom 요소를 가져옴
  // 전역변수를 만들어서 이벤트 타입을 저장 왜 배열이 아닌 맵으로? 배열은 순서가 있어서 중복된 이벤트 타입을 처리할 수 없음

  // map에 element 가 있는지 확인
  // 있으면 기존 배열에 추가
  // 없으면 새 배열 만들고 추가
  if (eventListeners.has(element)) {
    eventListeners.get(element).push({
      eventType: eventType,
      handler: handler,
    });
  } else {
    eventListeners.set(element, [
      {
        eventType,
        handler,
      },
    ]);
  }
}

export function removeEvent(element, eventType, handler) {
  // 등록 이벤트 핸들러가 있는지 확인
  const listeners = eventListeners.get(element);
  if (listeners) {
    const filteredListeners = listeners.filter(
      ({ eventType: type, handler: fn }) =>
        type !== eventType || fn !== handler,
    );

    if (filteredListeners.length === 0) {
      eventListeners.delete(element);
    } else {
      eventListeners.set(element, filteredListeners);
    }
  }
}
