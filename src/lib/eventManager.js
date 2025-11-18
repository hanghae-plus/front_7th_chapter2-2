// WeakMap으로 각 요소에 등록된 이벤트 핸들러 저장
const eventStore = new WeakMap();

export function setupEventListeners(root) {
  const eventTypes = [
    "click",
    "submit",
    "input",
    "change",
    "keydown",
    "keyup",
    "mouseover",
    "mouseout",
    "focus",
    "blur",
  ];

  eventTypes.forEach((eventType) => {
    root.addEventListener(eventType, (e) => {
      let target = e.target;

      // 이벤트 버블링을 통해 상위로 올라가며 핸들러 찾기
      // TODO 아 이거 어려운데??
      while (target && target !== root) {
        const handlers = eventStore.get(target);
        if (handlers && handlers[eventType]) {
          handlers[eventType](e);
          return;
        }
        target = target.parentNode;
      }
    });
  });
}

export function addEvent(element, eventType, handler) {
  if (!eventStore.has(element)) {
    eventStore.set(element, {});
  }
  const handlers = eventStore.get(element);
  handlers[eventType] = handler;
}

export function removeEvent(element, eventType) {
  const handlers = eventStore.get(element);
  if (handlers) {
    delete handlers[eventType];
  }
}
