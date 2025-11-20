/**
 * ===================================
 * 이벤트 위임(Event Delegation) 시스템
 * ===================================
 *
 * 이벤트 위임이란?
 * - 개별 요소에 이벤트 리스너를 추가하는 대신
 * - 부모(root) 요소 하나에만 리스너를 추가
 * - 이벤트 버블링을 이용해 실제 클릭된 요소를 찾아 처리
 *
 * 왜 사용하는가?
 * 1. 메모리 효율: 1000개 버튼 → 1000개 리스너 대신 1개 리스너
 * 2. 동적 요소 처리: 나중에 추가되는 요소도 자동으로 작동
 * 3. 메모리 누수 방지: WeakMap 사용으로 자동 정리
 *
 * 데이터 구조:
 * eventHandlers = WeakMap {
 *   button1 => Map {
 *     "click" => Set { handler1, handler2 },
 *     "mouseover" => Set { handler3 }
 *   },
 *   input1 => Map {
 *     "input" => Set { handler4 }
 *   }
 * }
 */

/**
 * 이벤트 핸들러를 저장하는 WeakMap
 *
 * 왜 WeakMap을 사용하는가?
 *
 * ✅ WeakMap 사용 (현재):
 * - DOM 요소가 제거되면 자동으로 가비지 컬렉션됨
 * - 메모리 누수 방지
 *
 * 예시:
 * let button = document.createElement('button');
 * eventHandlers.set(button, handlers);
 * button.remove(); // DOM에서 제거
 * button = null;   // 참조 제거
 * → WeakMap은 자동으로 해당 엔트리 삭제 (메모리 정리)
 *
 * ❌ 일반 Map 사용했다면:
 * - DOM 요소가 제거되어도 Map에는 남아있음
 * - 메모리 누수 발생
 * - 수동으로 delete 호출 필요
 *
 * 타입: WeakMap<Element, Map<eventType, Set<handler>>>
 * - Key: DOM 요소 (Element)
 * - Value: Map {
 *     eventType(string): Set<handler(function)>
 *   }
 */
const eventHandlers = new WeakMap();

/**
 * 이벤트 리스너가 설정된 루트 엘리먼트를 추적하는 Set
 *
 * 왜 필요한가?
 * - setupEventListeners가 여러 번 호출되는 것을 방지
 * - 같은 root에 중복으로 이벤트 리스너를 추가하지 않기 위함
 *
 * 예시:
 * setupEventListeners(root); // root 추가
 * setupEventListeners(root); // 이미 있으므로 무시
 */
const roots = new Set();

/**
 * 루트 엘리먼트에 이벤트 위임을 설정하는 함수
 *
 * 이벤트 위임의 핵심 함수입니다.
 * root 요소에 이벤트 리스너를 추가하여,
 * 하위의 모든 요소에서 발생하는 이벤트를 캐치합니다.
 *
 * @param {Element} root - 이벤트 위임을 설정할 루트 요소 (보통 #app 또는 #root)
 *
 * @example
 * const app = document.getElementById('app');
 * setupEventListeners(app);
 * // 이제 app 안의 모든 요소의 이벤트가 app에서 처리됨
 *
 * 작동 원리:
 * 1. root에만 이벤트 리스너 추가
 * 2. 이벤트 발생 시 실제 클릭된 요소(event.target)부터 시작
 * 3. 버블링을 따라 상위로 올라가며 각 요소의 핸들러 찾기
 * 4. 등록된 핸들러가 있으면 실행
 */
export function setupEventListeners(root) {
  // ----------------------------------------
  // 중복 설정 방지
  // ----------------------------------------
  //
  // 같은 root에 여러 번 setupEventListeners를 호출하면
  // 이벤트 리스너가 중복으로 추가되어 핸들러가 여러 번 실행됨
  //
  // roots Set에 이미 있는지 확인하여 중복 방지
  if (roots.has(root)) return;
  roots.add(root);

  // ----------------------------------------
  // 지원하는 이벤트 타입들
  // ----------------------------------------
  //
  // 필요한 이벤트 타입만 추가
  // - click: 버튼, 링크 클릭
  // - input: 입력 필드 값 변경 (실시간)
  // - change: 입력 필드 값 변경 완료, select, checkbox 등
  // - submit: 폼 제출
  // - mouseover: 마우스 올렸을 때
  // - focus: 포커스 받았을 때 (버블링 안되므로 캡처 페이즈 필요할 수 있음)
  // - keydown: 키보드 입력
  //
  // 더 많은 이벤트 추가 가능: mouseenter, blur, scroll 등
  const eventTypes = [
    "click",
    "input",
    "change",
    "submit",
    "mouseover",
    "focus",
    "keydown",
  ];

  // 각 이벤트 타입에 대해 루트에 리스너 추가
  eventTypes.forEach((eventType) => {
    // ----------------------------------------
    // root에 이벤트 리스너 등록
    // ----------------------------------------
    //
    // 모든 하위 요소에서 발생하는 이벤트가 버블링되어
    // 이 리스너에 도달합니다.
    root.addEventListener(eventType, (event) => {
      // 실제로 이벤트가 발생한 요소
      // 예: 버튼을 클릭했다면 그 button 요소
      let target = event.target;

      // ----------------------------------------
      // 이벤트 버블링을 따라 상위로 올라가며 핸들러 찾기
      // ----------------------------------------
      //
      // DOM 구조:
      // <div id="root">
      //   <div class="container">
      //     <button id="btn">Click</button>
      //   </div>
      // </div>
      //
      // 버튼 클릭 시 이벤트 전파 순서:
      // 1. button#btn (event.target)
      // 2. div.container
      // 3. div#root (우리의 root, 여기서 멈춤)
      //
      // 각 단계에서 등록된 핸들러가 있는지 확인하고 실행
      while (target && target !== root) {
        // 현재 target에 등록된 핸들러들 가져오기
        // eventHandlers는 WeakMap<Element, Map<eventType, Set<handler>>>
        const handlers = eventHandlers.get(target);

        // handlers가 있고, 현재 eventType에 대한 핸들러가 있는지 확인
        if (handlers && handlers.has(eventType)) {
          // 해당 eventType의 핸들러 Set 가져오기
          // Set을 사용하는 이유: 같은 핸들러 중복 등록 방지
          const handlerSet = handlers.get(eventType);

          // Set의 모든 핸들러 실행
          // 예: button에 onClick 핸들러가 2개 등록되어 있으면 둘 다 실행
          handlerSet.forEach((handler) => {
            handler(event);
          });
        }

        // 부모 요소로 이동 (버블링)
        // 예: button → div.container → div#root
        target = target.parentElement;
      }
      // root에 도달하면 while 루프 종료
    });
  });
}

/*
 * setupEventListeners 실행 흐름 예시:
 *
 * // HTML
 * <div id="app">
 *   <div class="container">
 *     <button id="myBtn">Click me</button>
 *   </div>
 * </div>
 *
 * // JavaScript
 * const app = document.getElementById('app');
 * setupEventListeners(app);
 *
 * const button = document.getElementById('myBtn');
 * addEvent(button, 'click', () => console.log('Clicked!'));
 *
 * // 사용자가 버튼 클릭 시:
 *
 * 1. 클릭 이벤트 발생 → event.target = button#myBtn
 *
 * 2. 이벤트 버블링으로 app의 리스너에 도달
 *
 * 3. while 루프 시작:
 *    - target = button#myBtn
 *    - eventHandlers.get(button#myBtn) 확인
 *    - handlers.get('click') → Set { handler }
 *    - handler 실행 → "Clicked!" 출력
 *
 * 4. target = div.container (parentElement)
 *    - eventHandlers.get(div.container) → undefined
 *    - 건너뛰기
 *
 * 5. target = div#app (root)
 *    - while 조건 불만족 (target !== root)
 *    - 루프 종료
 *
 * 결과: 버튼의 클릭 핸들러만 실행됨!
 */

/**
 * 엘리먼트에 이벤트 핸들러를 등록하는 함수
 *
 * addEventListener를 직접 사용하지 않고,
 * WeakMap에 핸들러를 저장하여 이벤트 위임 시스템에서 사용합니다.
 *
 * @param {Element} element - 핸들러를 등록할 DOM 요소
 * @param {string} eventType - 이벤트 타입 (예: "click", "input", "change")
 * @param {Function} handler - 이벤트 핸들러 함수
 *
 * @example
 * const button = document.querySelector('button');
 * addEvent(button, 'click', () => console.log('Clicked!'));
 * addEvent(button, 'click', () => console.log('Also clicked!'));
 * // 같은 요소에 같은 타입의 핸들러 여러 개 등록 가능
 *
 * 데이터 구조:
 * eventHandlers = WeakMap {
 *   button => Map {
 *     "click" => Set { handler1, handler2 }
 *   }
 * }
 */
export function addEvent(element, eventType, handler) {
  // ----------------------------------------
  // 1단계: element에 대한 Map이 없으면 생성
  // ----------------------------------------
  //
  // eventHandlers는 WeakMap이므로
  // 처음 element에 핸들러를 추가할 때는
  // Map을 생성해야 함
  if (!eventHandlers.has(element)) {
    eventHandlers.set(element, new Map());
    // 이제: eventHandlers = WeakMap { element => Map {} }
  }

  // element에 대한 Map 가져오기
  // Map<eventType, Set<handler>>
  const handlers = eventHandlers.get(element);

  // ----------------------------------------
  // 2단계: eventType에 대한 Set이 없으면 생성
  // ----------------------------------------
  //
  // Map에 해당 eventType이 없으면
  // 새로운 Set을 생성하여 추가
  //
  // Set을 사용하는 이유:
  // - 같은 핸들러가 중복으로 등록되는 것을 자동으로 방지
  // - 예: addEvent(btn, 'click', handler) 두 번 호출해도
  //      Set에는 handler가 1개만 저장됨
  if (!handlers.has(eventType)) {
    handlers.set(eventType, new Set());
    // 이제: handlers = Map { eventType => Set {} }
  }

  // ----------------------------------------
  // 3단계: handler를 Set에 추가
  // ----------------------------------------
  //
  // Set.add()는 중복을 자동으로 처리
  // 같은 함수 참조를 여러 번 추가해도 1개만 저장됨
  handlers.get(eventType).add(handler);

  /*
   * 최종 상태 예시:
   *
   * addEvent(button, 'click', handler1);
   * addEvent(button, 'click', handler2);
   * addEvent(button, 'mouseover', handler3);
   *
   * eventHandlers = WeakMap {
   *   button => Map {
   *     "click" => Set { handler1, handler2 },
   *     "mouseover" => Set { handler3 }
   *   }
   * }
   */
}

/*
 * addEvent 사용 예시:
 *
 * // 1. 단일 핸들러
 * const button = document.querySelector('button');
 * addEvent(button, 'click', () => console.log('Clicked'));
 *
 * // 2. 같은 요소에 여러 핸들러
 * addEvent(button, 'click', handleClick1);
 * addEvent(button, 'click', handleClick2);
 * // 클릭 시 둘 다 실행됨
 *
 * // 3. 여러 이벤트 타입
 * addEvent(button, 'click', handleClick);
 * addEvent(button, 'mouseover', handleHover);
 *
 * // 4. 같은 핸들러 중복 등록 방지
 * const handler = () => console.log('Only once');
 * addEvent(button, 'click', handler);
 * addEvent(button, 'click', handler); // Set이 중복 제거
 * // 클릭 시 1번만 실행됨
 */

/**
 * 엘리먼트에서 이벤트 핸들러를 제거하는 함수
 *
 * addEvent로 등록한 핸들러를 제거합니다.
 * 사용하지 않는 핸들러를 정리하여 메모리 누수를 방지합니다.
 *
 * @param {Element} element - 핸들러를 제거할 DOM 요소
 * @param {string} eventType - 이벤트 타입 (예: "click", "input")
 * @param {Function} handler - 제거할 이벤트 핸들러 함수
 *
 * @example
 * const handler = () => console.log('Clicked');
 * addEvent(button, 'click', handler);
 * // ... 나중에
 * removeEvent(button, 'click', handler); // 핸들러 제거
 *
 * 메모리 정리:
 * - Set이 비면 Map에서 제거
 * - Map이 비면 WeakMap에서 제거
 * - 깨끗한 상태 유지
 */
export function removeEvent(element, eventType, handler) {
  // ----------------------------------------
  // 1단계: element에 등록된 핸들러가 있는지 확인
  // ----------------------------------------
  //
  // eventHandlers에 element가 없으면
  // 아무 핸들러도 등록되지 않은 것이므로 종료
  const handlers = eventHandlers.get(element);
  if (!handlers) return;

  // ----------------------------------------
  // 2단계: eventType에 대한 핸들러 Set 가져오기
  // ----------------------------------------
  //
  // handlers Map에서 해당 eventType의 Set을 가져옴
  // 없으면 해당 이벤트 타입에 핸들러가 없으므로 종료
  const handlerSet = handlers.get(eventType);
  if (!handlerSet) return;

  // ----------------------------------------
  // 3단계: handler를 Set에서 제거
  // ----------------------------------------
  //
  // Set.delete()는 해당 요소를 제거
  // 없으면 아무 일도 일어나지 않음
  handlerSet.delete(handler);

  // ----------------------------------------
  // 4단계: 메모리 정리 - 빈 Set 제거
  // ----------------------------------------
  //
  // Set이 비어있으면 (모든 핸들러가 제거됨)
  // Map에서 해당 eventType을 제거
  //
  // 예: Map { "click" => Set {}, "input" => Set { handler } }
  //     → Map { "input" => Set { handler } }
  if (handlerSet.size === 0) {
    handlers.delete(eventType);
  }

  // ----------------------------------------
  // 5단계: 메모리 정리 - 빈 Map 제거
  // ----------------------------------------
  //
  // Map도 비어있으면 (모든 이벤트 타입이 제거됨)
  // WeakMap에서 element 엔트리를 제거
  //
  // 이렇게 하면 eventHandlers가 항상 깨끗하게 유지됨
  // 메모리 효율적
  if (handlers.size === 0) {
    eventHandlers.delete(element);
  }
}

/*
 * removeEvent 메모리 정리 예시:
 *
 * // 초기 상태
 * eventHandlers = WeakMap {
 *   button => Map {
 *     "click" => Set { handler1, handler2 },
 *     "mouseover" => Set { handler3 }
 *   }
 * }
 *
 * // 1. handler1 제거
 * removeEvent(button, 'click', handler1);
 *
 * eventHandlers = WeakMap {
 *   button => Map {
 *     "click" => Set { handler2 },  // handler1 제거됨
 *     "mouseover" => Set { handler3 }
 *   }
 * }
 *
 * // 2. handler2도 제거
 * removeEvent(button, 'click', handler2);
 *
 * // Set이 비어있음 → eventType 제거
 * eventHandlers = WeakMap {
 *   button => Map {
 *     "mouseover" => Set { handler3 }  // "click" 제거됨
 *   }
 * }
 *
 * // 3. handler3도 제거
 * removeEvent(button, 'mouseover', handler3);
 *
 * // Map도 비어있음 → element 엔트리 제거
 * eventHandlers = WeakMap { }  // 완전히 비어있음
 *
 * // 메모리가 깨끗하게 정리됨!
 */

/*
 * 전체 시스템 통합 예시:
 *
 * // 1. 앱 초기화
 * const app = document.getElementById('app');
 * setupEventListeners(app);
 * // → app에 이벤트 리스너 설정 (위임)
 *
 * // 2. JSX 렌더링
 * function TodoItem({ onDelete }) {
 *   return <button onClick={onDelete}>Delete</button>;
 * }
 *
 * // 3. createElement에서 addEvent 호출
 * const button = document.createElement('button');
 * addEvent(button, 'click', handleDelete);
 * // → eventHandlers에 저장
 *
 * // 4. 사용자가 버튼 클릭
 * // → app의 리스너가 이벤트 캐치 (위임)
 * // → 버블링으로 button까지 도달
 * // → eventHandlers에서 handleDelete 찾기
 * // → handleDelete 실행!
 *
 * // 5. 컴포넌트 제거 (DOM에서 삭제)
 * button.remove();
 * button = null;
 * // → WeakMap이 자동으로 정리 (가비지 컬렉션)
 * // → 메모리 누수 없음!
 *
 * // 6. 명시적으로 핸들러만 제거하고 싶을 때
 * removeEvent(button, 'click', handleDelete);
 * // → eventHandlers에서 핸들러 제거
 * // → 버튼은 남아있지만 클릭 이벤트 없음
 */
