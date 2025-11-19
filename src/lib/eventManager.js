// 이벤트 핸들러를 저장하는 WeakMap
// element -> { eventType -> Set<handler> }
const eventHandlers = new WeakMap();

// root에 이미 설정된 이벤트 타입을 추적
const setupRoots = new WeakMap();

export function setupEventListeners(root) {
  // 이벤트 위임: root에 등록된 모든 이벤트 타입에 대해 리스너 설정
  const eventTypes = new Set();

  // root 하위의 모든 요소를 순회하며 등록된 이벤트 타입 수집
  const collectEventTypes = (element) => {
    const handlers = eventHandlers.get(element);
    if (handlers) {
      Object.keys(handlers).forEach((type) => eventTypes.add(type));
    }

    // 자식 요소들도 재귀적으로 탐색
    Array.from(element.children).forEach(collectEventTypes);
  };

  collectEventTypes(root);

  const existingTypes = setupRoots.get(root) || new Set();

  // 각 이벤트 타입에 대해 root에 위임 리스너 등록 (중복 방지)
  eventTypes.forEach((eventType) => {
    if (!existingTypes.has(eventType)) {
      root.addEventListener(eventType, (event) => {
        // 이벤트 버블링을 통해 타겟부터 root까지 순회
        let target = event.target;

        while (target && target !== root) {
          const handlers = eventHandlers.get(target);
          if (handlers && handlers[eventType]) {
            // 등록된 모든 핸들러 실행
            handlers[eventType].forEach((handler) => {
              handler(event);
            });
          }
          target = target.parentElement;
        }

        // root 자체에 등록된 핸들러도 확인
        const rootHandlers = eventHandlers.get(root);
        if (rootHandlers && rootHandlers[eventType]) {
          rootHandlers[eventType].forEach((handler) => {
            handler(event);
          });
        }
      });
      existingTypes.add(eventType);
    }
  });

  setupRoots.set(root, existingTypes);
}

export function addEvent(element, eventType, handler) {
  // element에 대한 핸들러 맵이 없으면 생성
  if (!eventHandlers.has(element)) {
    eventHandlers.set(element, {});
  }

  const handlers = eventHandlers.get(element);

  // eventType에 대한 Set이 없으면 생성
  if (!handlers[eventType]) {
    handlers[eventType] = new Set();
  }

  // 핸들러 추가
  handlers[eventType].add(handler);
}

export function removeEvent(element, eventType, handler) {
  const handlers = eventHandlers.get(element);

  if (handlers && handlers[eventType]) {
    handlers[eventType].delete(handler);

    // Set이 비어있으면 제거
    if (handlers[eventType].size === 0) {
      delete handlers[eventType];
    }
  }
}
