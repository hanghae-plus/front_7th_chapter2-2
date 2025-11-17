// 등록된 이벤트 타입들을 추적하는 Set
const registeredEventTypes = new Set();

// setupEventListeners를 이용해서 이벤트 함수를 가져와서 한 번에 root에 이벤트를 등록합니다.
export function setupEventListeners(root) {
  // 실제로 등록된 이벤트 타입들에 대해서만 root에 리스너 등록
  registeredEventTypes.forEach((eventType) => {
    root.addEventListener(eventType, (event) => {
      // 클릭된 요소(event.target)부터 시작해서 root까지 올라가기
      let target = event.target;
      while (target && target !== root) {
        // 현재 요소에 __events가 있고, 해당 eventType 핸들러가 있으면
        if (target.__events && target.__events[eventType]) {
          // 모든 핸들러 실행
          target.__events[eventType].forEach((handler) => {
            handler(event);
          });
        }

        // 부모로 올라가기 (버블링)
        target = target.parentElement;
      }
    });
  });
}

// addEvent와 removeEvent를 통해 element에 대한 이벤트 함수를 어딘가에 저장하거나 삭제합니다.
export function addEvent(element, eventType, handler) {
  // 이벤트 타입을 등록된 타입 Set에 추가 (동적으로 추적)
  registeredEventTypes.add(eventType);

  // 1. element에 __events 속성이 없으면 빈 객체로 초기화
  if (!element.__events) {
    element.__events = {};
  }
  // 2. eventType에 해당하는 배열이 없으면 빈 배열로 초기화
  if (!element.__events[eventType]) {
    element.__events[eventType] = [];
  }
  // 3. 핸들러를 배열에 추가
  element.__events[eventType].push(handler);
}

export function removeEvent(element, eventType, handler) {
  // 1. __events가 없거나 해당 eventType이 없으면 종료
  if (!element.__events || !element.__events[eventType]) return;
  // 2. 배열에서 handler를 찾아서 제거
  //    배열.filter()나 배열.splice()를 사용
  element.__events[eventType] = element.__events[eventType].filter((h) => h !== handler);
}

// eventManager: 이벤트 위임(Event Delegation) 패턴 구현
//
// 왜 필요할까?
// - 각 요소마다 이벤트 리스너를 등록하면 메모리 낭비
// - 동적으로 추가된 요소에 이벤트 등록이 어려움
// - 루트에 하나만 등록하고, 이벤트가 발생하면 target을 찾아서 처리
