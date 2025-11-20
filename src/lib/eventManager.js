// Map { element → Map { eventType → handler } }
const eventRegistry = new Map();
const setupRoots = new WeakSet();

export function setupEventListeners(root) {
  if (setupRoots.has(root)) return;
  setupRoots.add(root);

  const eventTypes = [
    "click",
    "mouseover",
    "focus",
    "keydown",
    "input",
    "change",
    "submit",
    "reset",
  ];

  eventTypes.forEach((eventType) => {
    root.addEventListener(eventType, (event) => {
      let currentElement = event.target;
      // 버블링 경로 순회
      while (currentElement && currentElement !== root.parentElement) {
        // stopPropagation 호출 시 버블링 중단
        if (event.cancelBubble) break;

        const handlerElement = eventRegistry.get(currentElement);

        if (handlerElement) {
          const handler = handlerElement.get(eventType);

          if (handler) handler(event);
        }

        currentElement = currentElement.parentNode;
      }
    });
  });
}

/**
 * @param {HTMLElement} element
 * @param {string} eventType
 * @param {Function} handler
 */
export function addEvent(element, eventType, handler) {
  if (!eventRegistry.has(element)) {
    eventRegistry.set(element, new Map());
  }

  const elementHandlers = eventRegistry.get(element);
  elementHandlers.set(eventType, handler);
}

export function removeEvent(element, eventType, handler) {
  const elementHandlers = eventRegistry.get(element);
  if (elementHandlers) {
    elementHandlers.delete(eventType);

    if (elementHandlers.size === 0) {
      eventRegistry.delete(element);
    }
  }
}
