## 파일: `src/lib/eventManager.js`

### 1. 이 파일이 하는 일을 한 줄로 말하면

**여러 요소의 onClick/onChange 같은 이벤트를 “루트 하나에 위임”해서 관리하는 도우미**입니다.  
실제 DOM 요소마다 개별 리스너를 다는 대신, `root` 에 공용 리스너를 달고 거기서 이벤트를 분배합니다.

---

### 2. 현재 구현 구조 – 진짜 쉽게 풀어서 설명

```js
// key: element, value: Map<eventType, Set<handler>>
const eventHandlers = new WeakMap();

// 루트별로 등록된 이벤트 리스너 추적
const rootListeners = new WeakMap();
```

- `eventHandlers`:
  - 각 DOM 요소를 key 로 쓰고,
  - 그 요소에 대해 **어떤 타입의 이벤트에 어떤 핸들러들이 달려 있는지**를 기억합니다.
  - 구조: `Map<element, Map<eventType, Set<handler>>>`
- `rootListeners`:
  - 각 루트 컨테이너(`root`)에 이미 이벤트 위임 리스너를 붙였는지 추적합니다.
  - 중복으로 여러 번 리스너를 다는 것을 막습니다.

#### 2-1. `setupEventListeners(root)` – 루트에 이벤트 위임 리스너 달기

```js
export function setupEventListeners(root) {
  // 이미 설정된 경우 중복 등록 방지
  if (rootListeners.has(root)) {
    return;
  }

  const registeredListeners = new Set();

  const handleEvent = (event) => {
    if (event.cancelBubble) {
      return;
    }

    let target = event.target;

    while (target && target !== root) {
      const handlers = eventHandlers.get(target);
      if (handlers) {
        const handlersForType = handlers.get(event.type);
        if (handlersForType && handlersForType.size > 0) {
          handlersForType.forEach((handler) => {
            handler(event);
          });
        }
      }
      target = target.parentElement;
    }
  };
```

- `setupEventListeners(root)` 는 한 루트 컨테이너(예: `#root`)에 대해 **단 한 번만** 호출됩니다.
- 내부의 `handleEvent` 는:
  - 브라우저에서 발생한 이벤트 객체(`event`)를 받아서
  - `event.target`(실제로 클릭된 요소)에서 시작해 부모 방향(`parentElement`)으로 올라가면서
  - `eventHandlers` 에 등록된 핸들러들을 찾아 실행합니다.
  - `event.cancelBubble` 이 `true` 이면(= `stopPropagation()` 이 호출되면) 더 이상 위로 올라가지 않습니다.

```js
  const eventTypes = [
    "click",
    "change",
    "input",
    "submit",
    "focus",
    "blur",
    "keydown",
    "keyup",
    "keypress",
    "mousedown",
    "mouseup",
    "mousemove",
    "mouseover",
    "mouseout",
  ];

  eventTypes.forEach((eventType) => {
    root.addEventListener(eventType, handleEvent, false);
    registeredListeners.add({ type: eventType, handler: handleEvent });
  });

  rootListeners.set(root, registeredListeners);
}
```

- `eventTypes` 에 적힌 여러 이벤트 타입들에 대해,
  - `root.addEventListener(eventType, handleEvent, false)` 로 **버블링 단계에서 한 번씩만** 리스너를 붙입니다.
- 이 덕분에:
  - 버튼 100개가 있어도, 실제 DOM 에는 루트에 리스너 1개만 붙고,
  - 각 버튼은 단지 “나한테 이런 핸들러들이 있어요” 라는 정보만 `eventHandlers` 에 저장합니다.

#### 2-2. `addEvent(element, eventType, handler)` – 요소에 핸들러 등록

```js
export function addEvent(element, eventType, handler) {
  if (!eventHandlers.has(element)) {
    eventHandlers.set(element, new Map());
  }

  const handlers = eventHandlers.get(element);
  if (!handlers.has(eventType)) {
    handlers.set(eventType, new Set());
  }

  handlers.get(eventType).add(handler);
}
```

- 실제 DOM 요소(예: 장바구니 버튼)에 대해:
  - `eventHandlers` 에서 그 요소의 엔트리를 가져오거나 새로 만들고,
  - `eventType`(예: `"click"`) 에 해당하는 Set 안에 `handler` 를 추가합니다.
- 나중에 루트에서 이벤트가 발생하면,
  - `handleEvent` 가 이 `eventHandlers` 를 참고해서 올바른 핸들러를 찾아 실행합니다.

#### 2-3. `removeEvent(element, eventType, handler)` – 요소에서 핸들러 제거

```js
export function removeEvent(element, eventType, handler) {
  const handlers = eventHandlers.get(element);
  if (!handlers) {
    return;
  }

  const handlersForType = handlers.get(eventType);
  if (!handlersForType) {
    return;
  }

  handlersForType.delete(handler);

  if (handlersForType.size === 0) {
    handlers.delete(eventType);
  }

  if (handlers.size === 0) {
    eventHandlers.delete(element);
  }
}
```

- 특정 요소에서 더 이상 필요 없는 핸들러를 안전하게 제거합니다.
- 해당 타입의 핸들러가 하나도 안 남으면 그 타입 엔트리도 지우고,
- 그 요소에 아무 이벤트도 안 남았으면 `eventHandlers` 의 요소 엔트리도 정리합니다.

---

### 3. 한때 있었던 버그: “두 번째 클릭에서 수량이 3이 되는” 이상한 현상

#### 3-1. 증상 요약

E2E 테스트에서 아래와 같은 상황이 나타났습니다.

- 첫 번째 테스트: 장바구니 담기 버튼을 눌러서 수량이 정상적으로 증가.
- 이후 특정 리팩터링 버전에서는:
  - **장바구니에 상품을 한 번 담았는데 수량이 2씩 증가**하거나,
  - 한 테스트 안에서 두 번만 클릭했는데 수량이 **4**가 되는 현상.
- 특히 `"샷시 풍지판"` 아이템의 경우,
  - 이 테스트에서 한 번만 추가했음에도 수량이 3으로 잡혀서  
    총 금액이 670원이 아니라 1,130원으로 계산되는 문제가 발생했습니다.

당시 문제가 되었던 구현은 대략 아래와 같은 형태였습니다 (요약):

```js
const registeredEventTypes = new Set();

export function setupEventListeners(root) {
  registeredEventTypes.forEach((eventType) => {
    root.addEventListener(eventType, (event) => {
      let target = event.target;
      while (target && target !== root) {
        if (target.__events && target.__events[eventType]) {
          target.__events[eventType].forEach((handler) => {
            handler(event);
          });
        }
        target = target.parentElement;
      }
    });
  });
}

export function addEvent(element, eventType, handler) {
  registeredEventTypes.add(eventType);

  if (!element.__events) {
    element.__events = {};
  }
  if (!element.__events[eventType]) {
    element.__events[eventType] = [];
  }
  element.__events[eventType].push(handler);
}
```

- 루트별 중복 등록 방어가 약했고,
- 한 요소의 `__events[eventType]` 배열에 **같은 핸들러가 중복 추가**될 수 있었기 때문에  
클릭 한 번에 `handler` 가 여러 번 실행되는 상황이 생길 여지가 있었습니다.

#### 3-2. 원인: 이벤트 위임 구현을 잘못 리팩터링해서, 핸들러가 두 번씩 실행됨

당시 시도했던 리팩터링 버전에서는:

- `WeakMap(element → Map(eventType → handlers))` 대신,
  - DOM 요소에 직접 `element.__events[eventType] = [handlers...]` 형태로 달아두고,
  - `registeredEventTypes` 라는 `Set` 을 이용해 **등록된 이벤트 타입만** 루트에 리스너를 다시 다는 구조를 사용했습니다.

문제는:

- `setupEventListeners(root)` 와 `addEvent` 를 설계할 때,
  - 이미 루트에 리스너가 붙어 있는데도 **동일 타입의 리스너를 다시 여러 번 다는 경우**가 생기거나,
  - 한 요소에 같은 핸들러가 배열에 중복 추가되는 상황을 방지하지 못했고,
- 그 결과:
  - 클릭 한 번에 `handleEvent` 가 두 번 호출되거나,
  - 같은 `handler` 가 배열 안에 두 번 들어 있어 한 번의 클릭에 **핸들러가 2회 실행**되는 케이스가 발생했습니다.

장바구니 로직에서는:

- `addToCart` 가 버튼의 onClick 핸들러로 연결되어 있었기 때문에,
- 클릭 한 번 → `addToCart` 두 번 → 수량이 1이 아니라 2씩 증가하게 되었고,
- 테스트 안에서 “샷시 풍지판 1번 추가” 했다고 생각했지만,
  - 실제로는 **2개 추가**가 되어 버려
  - 예전 테스트 상태(미리 담겨 있던 수량 1~2개)까지 겹치면서  
    최종 수량이 3개처럼 보이는 일이 벌어졌습니다.

#### 3-3. 어떻게 해결했는가

문제의 근본 원인은:

- **동적으로 이벤트 타입을 추적하는 커스텀 구조**를 사용하면서
  - “루트에 리스너가 몇 번 붙었는지”
  - “한 요소에 같은 핸들러가 중복 등록되었는지”
  를 정확히 관리하지 못한 데 있었습니다.

그래서 해결 방법은 단순했습니다:

- `eventManager.js` 를 **커밋 기준의 검증된 구현(WeakMap + rootListeners 구조)** 으로 되돌렸습니다.
  - 루트별로 `setupEventListeners` 를 정확히 한 번만 호출.
  - 각 요소와 핸들러는 `WeakMap(element → Map(eventType → Set(handler)))` 으로 관리.
  - Set 을 사용해 동일 핸들러가 중복으로 들어가도 한 번만 실행되도록 보장.

이렇게 되돌린 뒤에는:

- 클릭 한 번에 onClick 핸들러가 한 번만 실행되므로,
  - 장바구니 수량이 1씩 자연스럽게 증가하고,
- “샷시 풍지판 수량이 1이어야 하는데 3으로 나오는” 문제 역시  
  **이벤트 중복 실행이 아닌, 다른 로직(예전 테스트 상태 로드 등)에 의한 것인지 명확히 분리해서 볼 수 있게** 되었습니다.

---

### 4. 정리

- **현재 `eventManager` 구현**은:
  - 루트별로 한 번만 이벤트 위임 리스너를 등록하고,
  - 각 요소의 핸들러는 `WeakMap` + `Map` + `Set` 으로 안전하게 관리하는 구조입니다.
- 한때 시도했던 리팩터링(요소에 `__events` 를 붙이고, 타입을 동적으로 추적하는 방식)은
  - 설계 상 핸들러/리스너 중복 등록을 막기 어려웠고,
  - 실제로 “클릭 한 번에 핸들러 두 번 실행 → 수량이 2씩 증가” 같은 버그로 이어졌습니다.
- 지금 버전은 **검증된 구조로 되돌린 상태**이므로,
  - 수량/클릭 관련 문제를 추적할 때 `eventManager` 의 중복 실행을 의심할 필요는 적고,
  - 장바구니 상태/스토리지 로직 등 다른 부분을 더 자신 있게 조사할 수 있습니다.


