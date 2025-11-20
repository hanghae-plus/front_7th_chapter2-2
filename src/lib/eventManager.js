export function addEvent(element, eventType, handler) {
  // element에 __handlers 객체 없으면 생성
  if (!element.__handlers) {
    element.__handlers = {};
  }

  // 해당 이벤트 타입 배열 없으면 생성
  if (!element.__handlers[eventType]) {
    element.__handlers[eventType] = [];
  }

  // 핸들러 등록
  element.__handlers[eventType].push(handler);
}

export function removeEvent(element, eventType, handler) {
  if (!element.__handlers || !element.__handlers[eventType]) {
    return;
  }

  // 해당 핸들러 제거
  element.__handlers[eventType] = element.__handlers[eventType].filter(
    (h) => h !== handler
  );
}

export function setupEventListeners(root) {
  [
    'click',
    'mouseover',
    'focus',
    'keydown',
    'input',
    'change',
    'submit',
    'blur'
  ].forEach((eventType) => {
    root.addEventListener(eventType, (e) => {
      let target = e.target;

      while (target && target !== root) {
        if (target.__handlers && target.__handlers[eventType]) {
          target.__handlers[eventType].forEach((handler) => {
            handler(e);
          });
        }
        target = target.parentNode;
      }
    });
  });
}
