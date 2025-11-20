// 이벤트를 저장하는 맵: { element -> { eventType -> [handlers] } }
const eventStore = new WeakMap();

// 루트에 이미 등록된 이벤트 타입을 추적
const registeredEventTypes = new WeakMap();

export function setupEventListeners(root) {
  // 이벤트 타입별로 루트에 위임된 리스너를 등록
  const eventTypes = new Set();

  // 모든 저장된 이벤트 타입을 수집
  const collectEventTypes = (element) => {
    const events = eventStore.get(element);
    if (events) {
      Object.keys(events).forEach((type) => eventTypes.add(type));
    }

    // 자식 요소들도 재귀적으로 확인
    Array.from(element.children).forEach(collectEventTypes);
  };

  collectEventTypes(root);

  // 이 root에 이미 등록된 이벤트 타입 확인
  if (!registeredEventTypes.has(root)) {
    registeredEventTypes.set(root, new Set());
  }
  const registered = registeredEventTypes.get(root);

  // 각 이벤트 타입에 대해 루트에 위임 리스너 등록 (아직 등록되지 않은 것만)
  eventTypes.forEach((eventType) => {
    if (registered.has(eventType)) {
      return; // 이미 등록된 이벤트 타입은 건너뜀
    }

    root.addEventListener(eventType, (e) => {
      let target = e.target;

      // 이벤트 버블링을 따라가며 핸들러 실행
      while (target && target !== root) {
        const events = eventStore.get(target);
        if (events && events[eventType]) {
          events[eventType].forEach((handler) => {
            handler(e);
          });
        }
        target = target.parentElement;
      }

      // root 자체에도 핸들러가 있을 수 있음
      const rootEvents = eventStore.get(root);
      if (rootEvents && rootEvents[eventType]) {
        rootEvents[eventType].forEach((handler) => {
          handler(e);
        });
      }
    });

    registered.add(eventType);
  });
}

export function addEvent(element, eventType, handler) {
  // element에 대한 이벤트 맵이 없으면 생성
  if (!eventStore.has(element)) {
    eventStore.set(element, {});
  }

  const events = eventStore.get(element);

  // eventType에 대한 핸들러 배열이 없으면 생성
  if (!events[eventType]) {
    events[eventType] = [];
  }

  // 핸들러 추가
  events[eventType].push(handler);
}

export function removeEvent(element, eventType, handler) {
  const events = eventStore.get(element);
  if (!events || !events[eventType]) return;

  // 특정 핸들러 제거
  events[eventType] = events[eventType].filter((h) => h !== handler);

  // 핸들러가 모두 제거되면 eventType 삭제
  if (events[eventType].length === 0) {
    delete events[eventType];
  }
}
