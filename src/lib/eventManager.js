const elementEvents = new WeakMap();
const rootContainers = new Set();
const rootListeners = new WeakMap();
const eventTypeCounts = new Map();

const delegateEvent = (event, root, eventType) => {
  let current = event.target;

  while (current && root.contains(current)) {
    const eventsMap = elementEvents.get(current);
    if (eventsMap) {
      const handlers = eventsMap.get(eventType);
      if (handlers) {
        handlers.forEach((handler) => handler.call(current, event));
      }
    }

    if (current === root || event.cancelBubble) {
      break;
    }
    current = current.parentNode;
  }
};

const attachToRoot = (root, eventType) => {
  let listeners = rootListeners.get(root);
  if (!listeners) {
    listeners = new Map();
    rootListeners.set(root, listeners);
  }
  if (listeners.has(eventType)) return;

  const listener = (event) => delegateEvent(event, root, eventType);
  root.addEventListener(eventType, listener);
  listeners.set(eventType, listener);
};

const detachFromRoot = (root, eventType) => {
  const listeners = rootListeners.get(root);
  if (!listeners) return;

  const listener = listeners.get(eventType);
  if (!listener) return;

  root.removeEventListener(eventType, listener);
  listeners.delete(eventType);
};

const incrementEventType = (eventType) => {
  const prev = eventTypeCounts.get(eventType) ?? 0;
  eventTypeCounts.set(eventType, prev + 1);
  if (prev === 0) {
    rootContainers.forEach((root) => attachToRoot(root, eventType));
  }
};

const decrementEventType = (eventType) => {
  const prev = eventTypeCounts.get(eventType);
  if (prev == null) return;

  const next = prev - 1;
  if (next <= 0) {
    eventTypeCounts.delete(eventType);
    rootContainers.forEach((root) => detachFromRoot(root, eventType));
  } else {
    eventTypeCounts.set(eventType, next);
  }
};

export function setupEventListeners(root) {
  if (!root) return;
  if (!rootListeners.has(root)) {
    rootListeners.set(root, new Map());
  }
  rootContainers.add(root);

  for (const eventType of eventTypeCounts.keys()) {
    attachToRoot(root, eventType);
  }
}

export function addEvent(element, eventType, handler) {
  if (!element || typeof handler !== "function" || !eventType) return;

  let eventsMap = elementEvents.get(element);
  if (!eventsMap) {
    eventsMap = new Map();
    elementEvents.set(element, eventsMap);
  }

  let handlers = eventsMap.get(eventType);
  if (!handlers) {
    handlers = new Set();
    eventsMap.set(eventType, handlers);
  }

  if (handlers.has(handler)) {
    return;
  }

  handlers.add(handler);
  incrementEventType(eventType);
}

export function removeEvent(element, eventType, handler) {
  if (!element || !eventType || typeof handler !== "function") return;

  const eventsMap = elementEvents.get(element);
  if (!eventsMap) return;

  const handlers = eventsMap.get(eventType);
  if (!handlers) return;

  const removed = handlers.delete(handler);
  if (!removed) return;

  if (handlers.size === 0) {
    eventsMap.delete(eventType);
  }

  if (eventsMap.size === 0) {
    elementEvents.delete(element);
  }

  decrementEventType(eventType);
}
