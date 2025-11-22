const eventHandlers = new WeakMap();

function getElementHandlers(element) {
  if (!eventHandlers.has(element)) {
    eventHandlers.set(element, new Map());
  }
  return eventHandlers.get(element);
}

export function addEvent(element, eventType, handler) {
  const handlers = getElementHandlers(element);
  if (!handlers.has(eventType)) {
    handlers.set(eventType, new Set());
  }
  handlers.get(eventType).add(handler);
}

export function removeEvent(element, eventType, handler) {
  const handlers = getElementHandlers(element);
  if (handlers.has(eventType)) {
    handlers.get(eventType).delete(handler);
  }
}

const rootEventListeners = new WeakMap();

export function setupEventListeners(root) {
  let registeredHandlers = rootEventListeners.get(root);
  if (!registeredHandlers) {
    registeredHandlers = new Map();
    rootEventListeners.set(root, registeredHandlers);
  }

  const createDelegatedHandler = (eventType) => {
    return (event) => {
      if (event.eventPhase === Event.BUBBLING_PHASE && event.cancelBubble) {
        return;
      }

      let target = event.target;

      while (target && target !== root && target !== document) {
        const handlers = eventHandlers.get(target);
        if (handlers && handlers.has(eventType)) {
          const handlerSet = handlers.get(eventType);
          handlerSet.forEach((handler) => {
            handler(event);
          });
          break;
        }
        target = target.parentElement;
      }
    };
  };

  const collectEventTypes = (element) => {
    const handlers = eventHandlers.get(element);
    if (handlers) {
      handlers.forEach((_, eventType) => {
        if (!registeredHandlers.has(eventType)) {
          const delegatedHandler = createDelegatedHandler(eventType);
          registeredHandlers.set(eventType, delegatedHandler);
          root.addEventListener(eventType, delegatedHandler, false);
        }
      });
    }
    Array.from(element.children).forEach(collectEventTypes);
  };

  collectEventTypes(root);
}
