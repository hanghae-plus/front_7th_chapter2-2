import { addEvent } from "./eventManager";

/**
 * Boolean 속성 목록
 *
 * 이 속성들은 setAttribute가 아닌 property로 직접 설정해야 합니다.
 *
 * 왜 구분이 필요한가?
 * - setAttribute("checked", false) → HTML: checked="false"
 *   → 문자열 "false"는 truthy이므로 체크박스가 체크됨! (버그)
 * - element.checked = false → 올바르게 체크 해제됨
 *
 * Attribute vs Property:
 * - Attribute: HTML에 저장되는 문자열 값 (setAttribute로 설정)
 * - Property: DOM 객체의 JavaScript 속성 (element.checked = true)
 */
const BOOLEAN_PROPS = new Set(["checked", "disabled", "selected", "readOnly"]);

/**
 * 정규화된 vNode를 실제 브라우저 DOM 요소로 변환하는 함수
 *
 * normalizeVNode를 거친 vNode만 입력으로 받습니다.
 * 함수형 컴포넌트가 입력으로 들어오면 에러를 발생시킵니다.
 *
 * @param {string|number|Object|Array} vNode - 정규화된 vNode
 * @returns {Node} 실제 DOM 노드 (Element, Text, DocumentFragment)
 *
 * @example
 * // 문자열 → 텍스트 노드
 * createElement("Hello") // → Text Node("Hello")
 *
 * // vNode → DOM 요소
 * createElement({
 *   type: "div",
 *   props: { className: "box" },
 *   children: ["Hello"]
 * })
 * // → <div class="box">Hello</div>
 */
export function createElement(vNode) {
  // ========================================
  // 케이스 1: 함수형 컴포넌트는 에러
  // ========================================
  //
  // 안전장치 역할
  // - normalizeVNode를 거치지 않은 vNode가 들어오면 감지
  // - 개발 중 실수를 빠르게 발견할 수 있음
  //
  // 예: createElement({ type: Welcome, props: {...} })
  //     → 에러: "normalizeVNode를 먼저 사용하세요"
  if (vNode && typeof vNode.type === "function") {
    throw new Error(
      "함수형 컴포넌트는 createElement로 직접 변환할 수 없습니다. normalizeVNode를 먼저 사용하세요.",
    );
  }

  // ========================================
  // 케이스 2: null, undefined, boolean → 빈 텍스트 노드
  // ========================================
  //
  // 왜 빈 텍스트 노드를 만드는가?
  // - DOM에는 null을 추가할 수 없음
  // - 빈 텍스트 노드는 화면에 아무것도 표시하지 않음
  // - appendChild할 때 에러가 발생하지 않음
  //
  // normalizeVNode에서 이미 처리되지만,
  // 방어적 코딩으로 한 번 더 확인
  if (vNode == null || typeof vNode === "boolean") {
    return document.createTextNode("");
  }

  // ========================================
  // 케이스 3: 문자열이나 숫자 → 텍스트 노드
  // ========================================
  //
  // DOM의 텍스트 노드 생성
  // - document.createTextNode()는 문자열만 받음
  // - 숫자는 String()으로 변환
  //
  // 예: createElement("Hello") → Text Node("Hello")
  //     createElement(42) → Text Node("42")
  //
  // 사용 예시:
  // <div>Count: {count}</div>
  // → div의 children: ["Count: ", count(숫자)]
  // → ["Count: ", "42"] (정규화 후)
  // → [Text("Count: "), Text("42")]
  if (typeof vNode === "string" || typeof vNode === "number") {
    return document.createTextNode(String(vNode));
  }

  // ========================================
  // 케이스 4: 배열 → DocumentFragment
  // ========================================
  //
  // DocumentFragment란?
  // - 여러 DOM 노드를 담을 수 있는 임시 컨테이너
  // - 실제 DOM에 추가될 때 Fragment는 사라지고 children만 남음
  // - 성능 최적화: 여러 노드를 한 번에 추가 (reflow 최소화)
  //
  // 왜 필요한가?
  // - JSX에서 map 사용: {items.map(item => <li>{item}</li>)}
  // - 배열의 각 요소를 DOM으로 변환하여 Fragment에 담음
  //
  // 예시:
  // createElement([
  //   { type: "li", children: ["A"] },
  //   { type: "li", children: ["B"] }
  // ])
  // → DocumentFragment [ <li>A</li>, <li>B</li> ]
  // → ul.appendChild(fragment) → <ul><li>A</li><li>B</li></ul>
  if (Array.isArray(vNode)) {
    const fragment = document.createDocumentFragment();
    vNode.forEach((child) => {
      // 각 요소를 재귀적으로 DOM으로 변환하여 추가
      fragment.appendChild(createElement(child));
    });
    return fragment;
  }

  // ========================================
  // 케이스 5: 일반 vNode → 실제 DOM 엘리먼트 생성
  // ========================================
  //
  // 가장 일반적인 케이스: HTML 요소 생성
  //
  // 처리 순서:
  // 1. DOM 요소 생성 (document.createElement)
  // 2. 속성 설정 (updateAttributes)
  // 3. 자식 노드 추가 (재귀적으로 createElement 호출)

  // 1단계: DOM 요소 생성
  // 예: vNode.type = "div" → <div></div>
  //     vNode.type = "button" → <button></button>
  const $el = document.createElement(vNode.type);

  // 2단계: 속성 업데이트
  // props의 각 속성을 DOM 요소에 설정
  // (className, onClick, disabled 등)
  updateAttributes($el, vNode.props);

  // 3단계: 자식 노드 추가
  // children 배열의 각 요소를 재귀적으로 DOM으로 변환
  vNode.children.forEach((child) => {
    // undefined나 null은 건너뛰기
    // (normalizeVNode에서 대부분 제거되지만 방어적 코딩)
    if (child == null) return;

    // 재귀 호출: 자식 vNode도 DOM으로 변환
    // 예: child = "Hello" → Text Node("Hello")
    //     child = { type: "span", ... } → <span>...</span>
    $el.appendChild(createElement(child));
  });

  // 완성된 DOM 요소 반환
  // 예: <div class="box"><span>Hello</span></div>
  return $el;
}

/**
 * DOM 요소의 속성을 설정하는 헬퍼 함수
 *
 * 4가지 속성 타입을 다르게 처리:
 * 1. 이벤트 핸들러 (onClick, onChange 등) → eventManager 사용
 * 2. className → HTML의 "class" 속성으로 변환
 * 3. Boolean 속성 (checked, disabled 등) → property로 직접 설정
 * 4. 일반 속성 → setAttribute 사용
 *
 * @param {Element} $el - 속성을 설정할 DOM 요소
 * @param {Object|null} props - 설정할 속성들의 객체
 *
 * @example
 * updateAttributes(button, {
 *   className: "btn",
 *   disabled: true,
 *   onClick: handleClick
 * })
 * // → button.className = "btn"
 * // → button.disabled = true
 * // → addEvent(button, "click", handleClick)
 */
function updateAttributes($el, props) {
  // props가 없으면 아무것도 하지 않음
  // 예: <div>Hello</div> → props = null
  if (!props) return;

  // props 객체의 각 [key, value] 쌍을 순회
  // 예: { className: "btn", onClick: handler, disabled: true }
  Object.entries(props).forEach(([key, value]) => {
    // ----------------------------------------
    // 1. 이벤트 핸들러 (onClick, onChange 등)
    // ----------------------------------------
    //
    // 조건: key가 "on"으로 시작하고 value가 함수
    // 예: onClick, onChange, onSubmit, onMouseOver 등
    //
    // 왜 addEventListener를 직접 사용하지 않는가?
    // - 이벤트 위임(Event Delegation) 사용
    // - 메모리 효율적
    // - 동적으로 추가/제거되는 요소도 자동으로 처리
    //
    // eventManager.addEvent가 하는 일:
    // 1. WeakMap에 핸들러 저장
    // 2. root 요소에서 이벤트 캐치 (위임)
    // 3. 실제 클릭된 요소를 찾아 핸들러 실행
    if (key.startsWith("on") && typeof value === "function") {
      // "onClick" → "click"으로 변환
      // slice(2): "on" 제거
      // toLowerCase(): "Click" → "click"
      const eventType = key.slice(2).toLowerCase();

      // 이벤트 위임 시스템에 핸들러 등록
      // 예: addEvent($el, "click", handleClick)
      addEvent($el, eventType, value);
    }

    // ----------------------------------------
    // 2. className 속성
    // ----------------------------------------
    //
    // 왜 특별 처리가 필요한가?
    // - JavaScript에서 "class"는 예약어
    // - React/JSX에서는 "className" 사용
    // - HTML에서는 "class" 속성 사용
    //
    // 따라서 "className" → "class"로 변환
    else if (key === "className") {
      $el.setAttribute("class", value);
      // 예: <div class="container"></div>
    }

    // ----------------------------------------
    // 3. Boolean 속성 (checked, disabled, selected, readOnly)
    // ----------------------------------------
    //
    // ❌ 잘못된 방법:
    // $el.setAttribute("checked", false)
    // → HTML: <input checked="false">
    // → "false" 문자열은 truthy → 체크박스가 체크됨!
    //
    // ✅ 올바른 방법:
    // $el.checked = false
    // → DOM property로 직접 설정
    // → false면 체크 해제, true면 체크
    //
    // 왜 이런 차이가?
    // - Attribute는 항상 문자열
    // - Property는 JavaScript 값 (boolean, number 등)
    // - Boolean 속성은 property로 설정해야 의도대로 작동
    else if (BOOLEAN_PROPS.has(key)) {
      $el[key] = value; // property로 직접 설정
      // 예: button.disabled = true
      //     input.checked = true
      //     select.selected = true
    }

    // ----------------------------------------
    // 4. 일반 속성 (id, type, placeholder, data-* 등)
    // ----------------------------------------
    //
    // setAttribute로 HTML 속성 설정
    //
    // 예시:
    // - id="main" → <div id="main">
    // - type="text" → <input type="text">
    // - placeholder="Enter name" → <input placeholder="Enter name">
    // - data-id="123" → <div data-id="123">
    else {
      $el.setAttribute(key, value);
    }
  });
}

/*
 * 전체 흐름 예시:
 *
 * // 1. JSX
 * <form onSubmit={handleSubmit}>
 *   <input
 *     type="text"
 *     className="input"
 *     placeholder="Enter text"
 *     disabled={isLoading}
 *   />
 *   <button type="submit" disabled={!text}>
 *     Submit
 *   </button>
 * </form>
 *
 * // 2. normalizeVNode 후 vNode
 * {
 *   type: "form",
 *   props: { onSubmit: handleSubmit },
 *   children: [
 *     {
 *       type: "input",
 *       props: {
 *         type: "text",
 *         className: "input",
 *         placeholder: "Enter text",
 *         disabled: true
 *       },
 *       children: []
 *     },
 *     {
 *       type: "button",
 *       props: { type: "submit", disabled: false },
 *       children: ["Submit"]
 *     }
 *   ]
 * }
 *
 * // 3. createElement 처리
 *
 * // 3-1. form 요소 생성
 * const $form = document.createElement("form");
 *
 * // 3-2. form 속성 설정
 * updateAttributes($form, { onSubmit: handleSubmit });
 * // → addEvent($form, "submit", handleSubmit)
 *
 * // 3-3. input 요소 생성 및 속성 설정
 * const $input = document.createElement("input");
 * updateAttributes($input, {
 *   type: "text",           // → $input.setAttribute("type", "text")
 *   className: "input",     // → $input.setAttribute("class", "input")
 *   placeholder: "Enter text", // → $input.setAttribute("placeholder", "Enter text")
 *   disabled: true          // → $input.disabled = true (property!)
 * });
 *
 * // 3-4. button 요소 생성 및 속성 설정
 * const $button = document.createElement("button");
 * updateAttributes($button, {
 *   type: "submit",  // → $button.setAttribute("type", "submit")
 *   disabled: false  // → $button.disabled = false (property!)
 * });
 *
 * // 3-5. button의 children 추가
 * $button.appendChild(document.createTextNode("Submit"));
 *
 * // 3-6. form에 children 추가
 * $form.appendChild($input);
 * $form.appendChild($button);
 *
 * // 4. 최종 DOM 구조
 * <form>
 *   <input type="text" class="input" placeholder="Enter text" disabled>
 *   <button type="submit">Submit</button>
 * </form>
 *
 * // 이벤트는 eventManager의 WeakMap에 저장됨
 * // 실제 DOM에는 이벤트 리스너가 root에만 있음 (이벤트 위임)
 */
