/* eventStore = {
  click: [
    { element: <button>, handler: fn },
    { element: <div>, handler: fn },
  ],
  input: [
    { element: <input>, handler: fn }
  ]
}
  */
const eventStore = new Map();
const registeredEventTypes = new Set();

export function setupEventListeners(root) {
  for (const [eventType, handlers] of eventStore.entries()) {
    if (registeredEventTypes.has(eventType)) continue;
    registeredEventTypes.add(eventType);

    root.addEventListener(eventType, (event) => {
      const target = event.target;

      handlers.forEach(({ element, handler }) => {
        if (target === element || element.contains(target)) {
          handler.call(element, event);
        }
      });
    });
  }
}

export function addEvent(element, eventType, handler) {
  // 이벤트 스토어에 없는 이벤트 타입인 경우
  if (!eventStore.has(eventType)) {
    // 빈 배열로 이벤트 타입 등록
    eventStore.set(eventType, []);
  }
  // 해당 이벤트 타입에 인자로 받아온 element, handler 등록
  eventStore.get(eventType).push({ element, handler });
}

export function removeEvent(element, eventType, handler) {
  const list = eventStore.get(eventType);
  if (!list) return;
  // 기존 스토어에 등록되어 있는 해당 이벤트 타입에 대한 아이템 제거
  eventStore.set(
    eventType,
    list.filter((item) => item.element !== element || item.handler !== handler),
  );
}
