// 이벤트 핸들러를 저장하는 맵
// 구조: Map<element, Map<eventType, Set<handler>>>
const eventHandlers = new WeakMap();

// 각 root에 대해 등록된 이벤트 타입을 추적
// 구조: Map<root, Set<eventType>>
const rootEventTypes = new WeakMap();

// root와 이벤트 타입을 연결하는 맵 (setupEventListeners에서 사용)
// 구조: Map<root, Map<eventType, delegatedHandler>>
const rootDelegatedHandlers = new WeakMap();

export function setupEventListeners(root) {
  if (!root) return;

  // root에 등록된 이벤트 타입들을 가져옴
  const eventTypes = rootEventTypes.get(root);
  if (!eventTypes || eventTypes.size === 0) return;

  // root의 위임 핸들러 맵 가져오기 또는 생성
  let delegatedHandlers = rootDelegatedHandlers.get(root);
  if (!delegatedHandlers) {
    delegatedHandlers = new Map();
    rootDelegatedHandlers.set(root, delegatedHandlers);
  }

  // 각 이벤트 타입에 대해 위임 핸들러 등록
  eventTypes.forEach((eventType) => {
    // 이미 등록된 핸들러가 있다면 중복 등록 방지
    if (delegatedHandlers.has(eventType)) return;

    const delegatedHandler = (e) => {
      // 이벤트가 발생한 타겟부터 root까지 올라가면서 핸들러 찾기
      let target = e.target;
      const path = [];

      // 이벤트 경로 수집 (target부터 root까지)
      while (target && target !== root.parentNode) {
        path.push(target);
        if (target === root) break;
        target = target.parentNode;
      }

      // 경로를 따라가면서 등록된 핸들러 찾아서 실행
      for (const element of path) {
        const handlersMap = eventHandlers.get(element);
        if (handlersMap) {
          const handlers = handlersMap.get(eventType);
          if (handlers) {
            handlers.forEach((handler) => {
              handler(e);
            });
          }
        }
      }
    };

    // bubble phase에서 실행 (기본값, capture phase가 아님)
    root.addEventListener(eventType, delegatedHandler);
    delegatedHandlers.set(eventType, delegatedHandler);
  });
}

export function addEvent(element, eventType, handler) {
  if (!element || !eventType || !handler) return;

  // element의 핸들러 맵 가져오기 또는 생성
  let handlersMap = eventHandlers.get(element);
  if (!handlersMap) {
    handlersMap = new Map();
    eventHandlers.set(element, handlersMap);
  }

  // 해당 이벤트 타입의 핸들러 Set 가져오기 또는 생성
  let handlers = handlersMap.get(eventType);
  if (!handlers) {
    handlers = new Set();
    handlersMap.set(eventType, handlers);
  }

  // 핸들러 추가
  handlers.add(handler);

  // root 요소 찾기 (container)
  // element부터 시작해서 document.body의 직접 자식인 요소를 root로 사용
  let root = element;
  while (root.parentNode) {
    const parent = root.parentNode;
    // document.body의 직접 자식인 경우
    if (parent === document.body || parent === document) {
      // root는 document.body의 직접 자식인 요소 (현재 root)
      break;
    }
    // document.body나 document가 아니면 계속 올라감
    root = parent;
  }

  // root에 이벤트 타입 등록
  let eventTypes = rootEventTypes.get(root);
  if (!eventTypes) {
    eventTypes = new Set();
    rootEventTypes.set(root, eventTypes);
  }
  eventTypes.add(eventType);
}

export function removeEvent(element, eventType, handler) {
  if (!element || !eventType || !handler) return;

  const handlersMap = eventHandlers.get(element);
  if (!handlersMap) return;

  const handlers = handlersMap.get(eventType);
  if (!handlers) return;

  // 핸들러 제거
  handlers.delete(handler);

  // 해당 이벤트 타입의 핸들러가 없으면 맵에서 제거
  if (handlers.size === 0) {
    handlersMap.delete(eventType);
  }

  // element에 등록된 핸들러가 없으면 WeakMap에서 제거
  if (handlersMap.size === 0) {
    eventHandlers.delete(element);
  }
}

// container의 모든 자식 요소에 대해 container를 root로 설정
export function migrateRootToContainer(container) {
  if (!container) return;

  // container의 모든 자식 요소를 순회
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_ELEMENT,
    null,
  );

  const eventTypesSet = new Set();
  let node;
  while ((node = walker.nextNode())) {
    // 각 요소에 등록된 이벤트 핸들러 확인
    const handlersMap = eventHandlers.get(node);
    if (handlersMap) {
      // 각 이벤트 타입에 대해 container를 root로 설정
      handlersMap.forEach((handlers, eventType) => {
        if (handlers && handlers.size > 0) {
          eventTypesSet.add(eventType);
        }
      });
    }
  }

  // container를 root로 설정
  let eventTypes = rootEventTypes.get(container);
  if (!eventTypes) {
    eventTypes = new Set();
    rootEventTypes.set(container, eventTypes);
  }
  eventTypesSet.forEach((eventType) => {
    eventTypes.add(eventType);
  });
}
