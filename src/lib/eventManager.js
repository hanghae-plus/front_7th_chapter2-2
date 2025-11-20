const eventStorage = new WeakMap(); // 모듈 스코프에 한번만 만들기 (한번만 만들고 재사용)
const delegatedEventTypes = new Set(); // 어떤 이벤트 타입 위임할지 저장

export function setupEventListeners(root) {
  // 부모방향으로 올라가면서 등록된 핸들러 실행
  delegatedEventTypes.forEach((eventType) => {
    if (!root._delegated) root._delegated = new Set();
    if (root._delegated.has(eventType)) return;

    root.addEventListener(eventType, (e) => {
      let current = e.target;
      while (current && current !== root.parentNode) {
        const eventsType = eventStorage.get(current);
        const handlers = eventsType?.get(eventType);
        if (handlers) {
          handlers.forEach((handler) => handler(e));
          if (e.stopPropagation) e.stopPropagation();
        }
        current = current.parentNode;
      }
    });
    root._delegated.add(eventType);
  });
}

export function addEvent(element, eventType, handler) {
  // element에 대한 이벤트 핸들러 저장
  let eventsType = eventStorage.get(element);
  if (!eventsType) {
    eventsType = new Map();
    eventStorage.set(element, eventsType);
  }

  let handlers = eventsType.get(eventType);
  if (!handlers) {
    handlers = new Set();
    eventsType.set(eventType, handlers);
  }
  handlers.add(handler);
  delegatedEventTypes.add(eventType);
}

export function removeEvent(element, eventType, handler) {
  // element에 대한 이벤트 핸들러 제거
  const eventsType = eventStorage.get(element);
  if (!eventsType) return;

  const handlers = eventsType.get(eventType);
  if (!handlers) return;
  handlers.delete(handler);
  if (handlers.size === 0) {
    eventsType.delete(eventType);
  }
  if (eventsType.size === 0) {
    eventStorage.delete(element);
  }
}
