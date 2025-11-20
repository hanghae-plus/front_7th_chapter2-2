const eventDelegationMap = new WeakMap();
// 루트별로 등록된 이벤트 타입 추적
const rootEventTypes = new WeakMap();
// 루트별 delegationHandler 저장
const rootHandlers = new WeakMap();

export function setupEventListeners(root) {
  if (root.__isDelegated) {
    return;
  }

  const delegationHandler = (event) => {
    let target = event.target;

    while (target && target !== root) {
      if (event.cancelBubble) {
        break;
      }

      if (eventDelegationMap.has(target)) {
        const elementMap = eventDelegationMap.get(target);
        const handlers = elementMap.get(event.type);

        if (handlers) {
          handlers.forEach((handler) => {
            if (event.cancelBubble) {
              return;
            }
            handler(event);
          });
        }
      }
      target = target.parentNode;
    }
  };

  // 초기 주요 이벤트 타입들 (성능 최적화)
  const commonEventTypes = ["click", "mouseover", "focus", "keydown", "change"];
  const registeredTypes = new Set(commonEventTypes);
  rootEventTypes.set(root, registeredTypes);
  rootHandlers.set(root, delegationHandler);

  commonEventTypes.forEach((eventType) => {
    root.addEventListener(eventType, delegationHandler, false);
  });

  root.__isDelegated = true;
}

export function addEvent(element, eventType, handler) {
  if (!eventDelegationMap.has(element)) {
    eventDelegationMap.set(element, new Map());
  }

  const elementMap = eventDelegationMap.get(element);

  if (!elementMap.has(eventType)) {
    elementMap.set(eventType, []);
  }

  elementMap.get(eventType).push(handler);

  // 동적 이벤트 등록: 루트 요소를 찾아서 이벤트 타입이 등록되지 않았으면 등록
  let rootElement = element;
  while (rootElement && rootElement.parentNode && !rootElement.__isDelegated) {
    rootElement = rootElement.parentNode;
  }

  if (rootElement && rootElement.__isDelegated) {
    const registeredTypes = rootEventTypes.get(rootElement);
    const delegationHandler = rootHandlers.get(rootElement);

    if (!registeredTypes.has(eventType)) {
      rootElement.addEventListener(eventType, delegationHandler, false);
      registeredTypes.add(eventType);
    }
  }
}

export function removeEvent(element, eventType, handler) {
  if (!eventDelegationMap.has(element)) {
    return;
  }

  const elementMap = eventDelegationMap.get(element);

  if (!elementMap.has(eventType)) {
    return;
  }

  const handlers = elementMap.get(eventType);

  if (handlers.includes(handler)) {
    handlers.splice(handlers.indexOf(handler), 1);
  }

  if (handlers.length === 0) {
    elementMap.delete(eventType);
  }

  if (elementMap.size === 0) {
    eventDelegationMap.delete(element);
  }
}
