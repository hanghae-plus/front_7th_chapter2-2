const eventHandlers = new WeakMap();
const rootListeners = new WeakMap();
const registeredTypes = new WeakMap();

export function setupEventListeners(root) {
  if (rootListeners.has(root)) {
    return;
  }

  registeredTypes.set(root, new Set());

  // 이벤트 위임 핸들러 생성
  const delegatedHandler = (event) => {
    // stopPropagation이 이미 호출되었으면 실행하지 않음
    if (event.cancelBubble) {
      return;
    }

    let target = event.target;

    // target부터 root까지 올라가면서 핸들러 찾기
    while (target && target !== root) {
      // target element에 등록된 핸들러가 있는지 확인
      if (eventHandlers.has(target)) {
        const elementHandlers = eventHandlers.get(target);
        const handlers = elementHandlers.get(event.type);

        if (handlers && handlers.size > 0) {
          // 모든 핸들러 실행
          handlers.forEach((handler) => {
            handler(event);
          });
        }
      }

      target = target.parentElement;
    }
  };

  // root에 리스너가 등록되었음을 표시
  rootListeners.set(root, delegatedHandler);

  // root의 모든 자식 요소를 확인해서 등록된 이벤트 타입 수집
  const eventTypes = new Set();
  const walker = (node) => {
    if (eventHandlers.has(node)) {
      const elementHandlers = eventHandlers.get(node);
      for (const eventType of elementHandlers.keys()) {
        eventTypes.add(eventType);
      }
    }
    for (const child of node.children || []) {
      walker(child);
    }
  };
  walker(root);

  // 수집한 이벤트 타입들을 root에 등록
  for (const eventType of eventTypes) {
    root.addEventListener(eventType, delegatedHandler, false);
    registeredTypes.get(root).add(eventType);
  }
}

// addEvent를 통해 element에 대한 이벤트 함수를 어딘가에 저장.
export function addEvent(element, eventType, handler) {
  // element가 저장 공간에 있는지 확인
  if (!eventHandlers.has(element)) {
    // 없으면 새로 만들기
    eventHandlers.set(element, new Map());
  }

  // eventType별 저장 공간이 있는지 확인
  const elementHandlers = eventHandlers.get(element);

  // 없으면 새로 만들기
  if (!elementHandlers.has(eventType)) {
    elementHandlers.set(eventType, new Set());
  }

  // 핸들러 함수 저장
  elementHandlers.get(eventType).add(handler);

  let current = element;
  while (current) {
    if (rootListeners.has(current)) {
      const types = registeredTypes.get(current);
      if (types && !types.has(eventType)) {
        const delegatedHandler = rootListeners.get(current);
        current.addEventListener(eventType, delegatedHandler, false);
        types.add(eventType);
      }
      break;
    }
    current = current.parentElement;
  }
}

// removeEvent 통해 element에 대한 이벤트 함수를 삭제.
export function removeEvent(element, eventType, handler) {
  // element에 대한 핸들러 맵이 없으면 종료
  if (!eventHandlers.has(element)) {
    return;
  }

  const elementHandlers = eventHandlers.get(element);

  // eventType에 대한 핸들러 Set이 없으면 종료
  if (!elementHandlers.has(eventType)) {
    return;
  }

  // 핸들러를 Set에서 제거
  elementHandlers.get(eventType).delete(handler);

  // Set이 비어있으면 제거
  if (elementHandlers.get(eventType).size === 0) {
    elementHandlers.delete(eventType);
  }
}
