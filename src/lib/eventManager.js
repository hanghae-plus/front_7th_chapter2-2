// 이벤트 핸들러를 저장하는 맵
// 키: 요소, 값: { eventType: [handlers] }
const eventHandlers = new WeakMap();

// 등록된 이벤트 타입 추적 (WeakMap은 열거할 수 없으므로 별도로 관리)
const registeredEventTypes = new Set();

// 루트별로 등록된 이벤트 타입 추적
const rootEventTypes = new WeakMap();

export function setupEventListeners(root) {
  // 이미 설정된 이벤트 타입 가져오기
  let rootTypes = rootEventTypes.get(root);
  if (!rootTypes) {
    rootTypes = new Set();
    rootEventTypes.set(root, rootTypes);
  }

  // 등록된 모든 이벤트 타입에 대해 위임 리스너 등록
  registeredEventTypes.forEach((eventType) => {
    if (rootTypes.has(eventType)) {
      return; // 이미 등록됨
    }
    rootTypes.add(eventType);

    root.addEventListener(eventType, (e) => {
      // 이벤트가 발생한 요소부터 루트까지 올라가며 핸들러 찾기
      let target = e.target;
      while (target && target !== root) {
        const handlers = eventHandlers.get(target);
        if (handlers && handlers[eventType]) {
          handlers[eventType].forEach((handler) => {
            handler(e);
          });
        }
        target = target.parentElement;
      }
    }); // bubble phase에서 실행 (기본값)
  });
}

export function addEvent(element, eventType, handler) {
  if (!eventHandlers.has(element)) {
    eventHandlers.set(element, {});
  }

  const handlers = eventHandlers.get(element);
  if (!handlers[eventType]) {
    handlers[eventType] = [];
    // 새로운 이벤트 타입 등록
    registeredEventTypes.add(eventType);
  }

  handlers[eventType].push(handler);
}

export function removeEvent(element, eventType, handler) {
  const handlers = eventHandlers.get(element);
  if (handlers && handlers[eventType]) {
    handlers[eventType] = handlers[eventType].filter((h) => h !== handler);
    if (handlers[eventType].length === 0) {
      delete handlers[eventType];
    }
  }
}
