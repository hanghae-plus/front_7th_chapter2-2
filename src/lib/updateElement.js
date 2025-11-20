import { addEvent, removeEvent } from "./eventManager";
import { createElement } from "./createElement.js";

/**
 * Boolean 속성 목록
 * createElement.js와 동일한 이유로 property로 직접 설정해야 함
 */
const BOOLEAN_PROPS = new Set(["checked", "disabled", "selected", "readOnly"]);

/**
 * DOM 요소의 속성을 업데이트하는 헬퍼 함수
 *
 * 이전 속성과 새 속성을 비교하여:
 * 1. 제거된 속성 처리
 * 2. 추가/변경된 속성만 업데이트
 *
 * @param {Element} target - 업데이트할 DOM 요소
 * @param {Object|null} originNewProps - 새로운 속성 객체
 * @param {Object|null} originOldProps - 이전 속성 객체
 *
 * @example
 * // Old: <button className="btn" disabled={true}>Click</button>
 * // New: <button className="btn primary">Click</button>
 * updateAttributes(button,
 *   { className: "btn primary" },
 *   { className: "btn", disabled: true }
 * )
 * // → className 변경, disabled 제거
 */
function updateAttributes(target, originNewProps, originOldProps) {
  // null 체크: props가 없으면 빈 객체로 처리
  const newProps = originNewProps || {};
  const oldProps = originOldProps || {};

  // ========================================
  // 1단계: 이전 속성 중 제거된 것 처리
  // ========================================
  //
  // oldProps에는 있지만 newProps에는 없는 속성을 찾아서 제거
  //
  // 예시:
  // oldProps = { className: "btn", disabled: true, onClick: handler }
  // newProps = { className: "btn primary", onClick: handler }
  // → disabled가 제거됨
  Object.keys(oldProps).forEach((key) => {
    // newProps에 해당 key가 없으면 제거해야 함
    if (!(key in newProps)) {
      // ----------------------------------------
      // 이벤트 핸들러 제거
      // ----------------------------------------
      if (key.startsWith("on")) {
        const eventType = key.slice(2).toLowerCase();
        // eventManager에서 핸들러 제거
        // WeakMap에서 삭제되어 메모리 정리
        removeEvent(target, eventType, oldProps[key]);
      }
      // ----------------------------------------
      // className 제거
      // ----------------------------------------
      else if (key === "className") {
        target.removeAttribute("class");
        // HTML에서 class="" 제거
      }
      // ----------------------------------------
      // Boolean 속성 제거
      // ----------------------------------------
      else if (BOOLEAN_PROPS.has(key)) {
        // setAttribute로 제거하면 안 됨!
        // property를 false로 설정
        target[key] = false;
        // 예: button.disabled = false
        //     input.checked = false
      }
      // ----------------------------------------
      // 일반 속성 제거
      // ----------------------------------------
      else {
        target.removeAttribute(key);
        // 예: id, type, placeholder 등
      }
    }
  });

  // ========================================
  // 2단계: 새 속성 추가 또는 값 변경
  // ========================================
  //
  // newProps의 각 속성을 oldProps와 비교
  // 값이 다르면 업데이트
  Object.entries(newProps).forEach(([key, value]) => {
    // ----------------------------------------
    // 성능 최적화: 값이 같으면 스킵
    // ----------------------------------------
    //
    // oldProps[key] === value면 변경 없음
    // DOM 조작을 최소화하여 성능 향상
    //
    // 예:
    // oldProps = { className: "btn", id: "submit" }
    // newProps = { className: "btn", id: "submit" }
    // → 모두 같으므로 아무것도 안 함
    if (oldProps[key] !== value) {
      // ----------------------------------------
      // 이벤트 핸들러 업데이트
      // ----------------------------------------
      if (key.startsWith("on")) {
        const eventType = key.slice(2).toLowerCase();

        // 이전 핸들러가 있으면 먼저 제거
        // 중요: 같은 eventType에 여러 핸들러가 등록되지 않도록
        if (oldProps[key]) {
          removeEvent(target, eventType, oldProps[key]);
        }

        // 새 핸들러 등록
        addEvent(target, eventType, value);

        /*
         * 예시:
         * oldProps = { onClick: oldHandler }
         * newProps = { onClick: newHandler }
         *
         * 1. removeEvent(target, "click", oldHandler)
         * 2. addEvent(target, "click", newHandler)
         *
         * 이제 클릭 시 newHandler만 실행됨
         */
      }
      // ----------------------------------------
      // className 업데이트
      // ----------------------------------------
      else if (key === "className") {
        target.setAttribute("class", value);
        // 예: "btn" → "btn primary"
      }
      // ----------------------------------------
      // Boolean 속성 업데이트
      // ----------------------------------------
      else if (BOOLEAN_PROPS.has(key)) {
        target[key] = value;
        // 예: button.disabled = true
        //     input.checked = false
      }
      // ----------------------------------------
      // 일반 속성 업데이트
      // ----------------------------------------
      else {
        target.setAttribute(key, value);
        // 예: id="main", type="text", placeholder="Enter..."
      }
    }
  });
}

/*
 * updateAttributes 실행 예시:
 *
 * // 변경 전
 * <button
 *   className="btn"
 *   disabled={true}
 *   onClick={oldHandler}
 *   id="submit"
 * >
 *   Click
 * </button>
 *
 * // 변경 후
 * <button
 *   className="btn primary"
 *   onClick={newHandler}
 *   id="submit"
 *   type="button"
 * >
 *   Click
 * </button>
 *
 * updateAttributes(button,
 *   { className: "btn primary", onClick: newHandler, id: "submit", type: "button" },
 *   { className: "btn", disabled: true, onClick: oldHandler, id: "submit" }
 * )
 *
 * 실행 과정:
 *
 * 1단계: 제거된 속성 처리
 * - disabled가 newProps에 없음
 *   → button.disabled = false
 *
 * 2단계: 추가/변경된 속성 처리
 * - className: "btn" !== "btn primary"
 *   → setAttribute("class", "btn primary")
 *
 * - onClick: oldHandler !== newHandler
 *   → removeEvent(button, "click", oldHandler)
 *   → addEvent(button, "click", newHandler)
 *
 * - id: "submit" === "submit"
 *   → 스킵 (변경 없음)
 *
 * - type: undefined !== "button"
 *   → setAttribute("type", "button")
 *
 * 결과:
 * <button class="btn primary" type="button" id="submit">
 *   Click
 * </button>
 * (disabled 제거됨, onClick 핸들러 교체됨)
 */

/**
 * ===================================
 * Diff 알고리즘: Virtual DOM의 핵심
 * ===================================
 *
 * 이전 vNode와 새 vNode를 비교하여
 * 최소한의 DOM 조작으로 화면을 업데이트합니다.
 *
 * React의 Reconciliation과 유사한 역할을 합니다.
 *
 * @param {Element} parentElement - 업데이트할 부모 DOM 요소
 * @param {any} newNode - 새로운 vNode (업데이트 후 상태)
 * @param {any} oldNode - 이전 vNode (업데이트 전 상태)
 * @param {number} index - 부모의 childNodes에서의 인덱스 (기본값: 0)
 *
 * @example
 * // 이전: <div><h1>Count: 0</h1></div>
 * // 새로운: <div><h1>Count: 1</h1></div>
 * updateElement(
 *   div,
 *   { type: "h1", children: ["Count: 1"] },
 *   { type: "h1", children: ["Count: 0"] },
 *   0
 * )
 * // → h1의 textContent만 "Count: 1"로 변경
 * //   h1 요소는 재사용!
 *
 * 처리하는 7가지 케이스:
 * 1. oldNode만 있음 → 제거
 * 2. newNode만 있음 → 추가
 * 3. 둘 다 텍스트/숫자 → textContent 업데이트
 * 4. 타입 변경 (텍스트 → 요소) → 교체
 * 5. 타입 변경 (요소 → 텍스트) → 교체
 * 6. 요소 타입 변경 (div → span) → 교체
 * 7. 같은 타입 요소 → 속성 업데이트 + 자식 재귀 처리
 */
export function updateElement(parentElement, newNode, oldNode, index = 0) {
  // ========================================
  // 케이스 1: oldNode만 있는 경우 → 노드 제거
  // ========================================
  //
  // 언제 발생하는가?
  // - 조건부 렌더링에서 요소가 사라짐
  //   예: {isVisible && <div>Content</div>}
  //       isVisible: true → false
  //
  // - 배열 요소 감소
  //   예: [li1, li2, li3] → [li1, li2]
  //
  // 처리: DOM에서 해당 노드 제거
  if (!newNode && oldNode) {
    const child = parentElement.childNodes[index];
    if (child) {
      return parentElement.removeChild(child);
    }
    return;
  }

  /*
   * 예시:
   * // Old: <ul><li>A</li><li>B</li><li>C</li></ul>
   * // New: <ul><li>A</li><li>B</li></ul>
   *
   * updateElement(ul, undefined, liC, 2);
   * // → ul.removeChild(ul.childNodes[2])
   *
   * 결과: <ul><li>A</li><li>B</li></ul>
   */

  // ========================================
  // 케이스 2: newNode만 있는 경우 → 노드 추가
  // ========================================
  //
  // 언제 발생하는가?
  // - 조건부 렌더링에서 요소가 나타남
  //   예: {isVisible && <div>Content</div>}
  //       isVisible: false → true
  //
  // - 배열 요소 증가
  //   예: [li1, li2] → [li1, li2, li3]
  //
  // 처리: createElement로 새 DOM 생성 후 추가
  if (newNode && !oldNode) {
    return parentElement.appendChild(createElement(newNode));
  }

  /*
   * 예시:
   * // Old: <ul><li>A</li><li>B</li></ul>
   * // New: <ul><li>A</li><li>B</li><li>C</li></ul>
   *
   * updateElement(ul, liC, undefined);
   * // → ul.appendChild(createElement(liC))
   *
   * 결과: <ul><li>A</li><li>B</li><li>C</li></ul>
   */

  // ========================================
  // 케이스 3: 둘 다 문자열/숫자 → 텍스트 노드 업데이트
  // ========================================
  //
  // 가장 흔한 케이스: 텍스트 내용 변경
  //
  // 왜 중요한가?
  // - 텍스트 노드를 새로 만들지 않고 textContent만 변경
  // - 매우 효율적 (DOM 생성 비용 없음)
  //
  // 예: <h1>Count: 0</h1> → <h1>Count: 1</h1>
  if (typeof newNode === "string" || typeof newNode === "number") {
    if (typeof oldNode === "string" || typeof oldNode === "number") {
      // 둘 다 텍스트/숫자
      if (newNode !== oldNode) {
        // 값이 다르면 textContent 업데이트
        const child = parentElement.childNodes[index];
        if (child) {
          child.textContent = String(newNode);
        }
      }
      // 같으면 아무것도 안 함 (최적화)
      return;
    } else {
      // oldNode는 요소, newNode는 텍스트 → 교체 (케이스 4)
      const child = parentElement.childNodes[index];
      if (child) {
        return parentElement.replaceChild(createElement(newNode), child);
      }
      return;
    }
  }

  /*
   * 예시:
   * // Old: <div>Hello</div>
   * // New: <div>Hi</div>
   *
   * // div의 children[0]:
   * updateElement(div, "Hi", "Hello", 0);
   * // → div.childNodes[0].textContent = "Hi"
   *
   * 결과: <div>Hi</div>
   * (Text 노드 재사용, textContent만 변경!)
   */

  // ========================================
  // 케이스 4: oldNode가 텍스트, newNode가 요소 → 교체
  // ========================================
  //
  // 타입이 완전히 변경됨 → 재사용 불가능 → 교체
  //
  // 예: <div>Hello</div> → <div><span>Hello</span></div>
  if (typeof oldNode === "string" || typeof oldNode === "number") {
    const child = parentElement.childNodes[index];
    if (child) {
      return parentElement.replaceChild(createElement(newNode), child);
    }
    return;
  }

  /*
   * 예시:
   * // Old: <div>Text</div>
   * // New: <div><strong>Text</strong></div>
   *
   * // div의 children[0]:
   * // oldNode = "Text" (문자열)
   * // newNode = { type: "strong", children: ["Text"] }
   *
   * updateElement(div, strongVNode, "Text", 0);
   * // → div.replaceChild(<strong>Text</strong>, textNode)
   *
   * 결과: <div><strong>Text</strong></div>
   */

  // ========================================
  // 케이스 5: 요소 타입이 변경됨 → 교체
  // ========================================
  //
  // 다른 타입의 요소는 재사용 불가능
  //
  // 왜 재사용하지 않는가?
  // - 구조가 완전히 다를 수 있음
  // - 속성, 자식이 전혀 다를 수 있음
  // - 새로 만드는 게 더 안전하고 간단
  //
  // 예: <div> → <span>, <li> → <div>
  if (newNode.type !== oldNode.type) {
    const child = parentElement.childNodes[index];
    if (child) {
      return parentElement.replaceChild(createElement(newNode), child);
    }
    return;
  }

  /*
   * 예시:
   * // Old: <ul><li>Item</li></ul>
   * // New: <ul><div>Item</div></ul>
   *
   * // ul의 children[0]:
   * // oldNode.type = "li"
   * // newNode.type = "div"
   *
   * updateElement(ul, divVNode, liVNode, 0);
   * // → ul.replaceChild(<div>Item</div>, <li>Item</li>)
   *
   * 결과: <ul><div>Item</div></ul>
   */

  // ========================================
  // 케이스 6 & 7: 같은 타입의 요소 → 재사용!
  // ========================================
  //
  // 가장 최적화된 경로
  // - DOM 요소 재사용
  // - 속성만 업데이트
  // - 자식 노드 재귀적으로 비교
  //
  // 이것이 Virtual DOM의 핵심 장점!
  const targetElement = parentElement.childNodes[index];

  if (targetElement) {
    // ----------------------------------------
    // 속성 업데이트
    // ----------------------------------------
    //
    // 같은 타입이지만 속성이 변경되었을 수 있음
    // 예: <div className="old"> → <div className="new">
    updateAttributes(targetElement, newNode.props, oldNode.props);

    // ----------------------------------------
    // 자식 노드 재귀적으로 업데이트
    // ----------------------------------------
    //
    // children 배열을 순회하며 각 자식 비교
    const newLength = newNode.children.length;
    const oldLength = oldNode.children.length;
    const maxLength = Math.max(newLength, oldLength);

    // 앞에서부터 순차적으로 비교
    // 예: [li1, li2, li3] vs [li1', li2', li4]
    //     i=0: li1 vs li1' (비교)
    //     i=1: li2 vs li2' (비교)
    //     i=2: li3 vs li4 (비교)
    for (let i = 0; i < maxLength; i++) {
      updateElement(
        targetElement, // 부모: 현재 요소
        newNode.children[i], // 새 자식 (없을 수 있음)
        oldNode.children[i], // 이전 자식 (없을 수 있음)
        i, // 인덱스
      );
    }

    /*
     * 재귀 호출 예시:
     *
     * // Old: <div><h1>A</h1><p>B</p><span>C</span></div>
     * // New: <div><h1>A'</h1><p>B'</p></div>
     *
     * updateElement(div, newDiv, oldDiv, 0);
     *
     * // div는 같은 타입 → 재사용
     * // updateAttributes(div, {...}, {...})
     *
     * // 자식 비교:
     * // maxLength = max(3, 2) = 3
     *
     * // i=0: h1 vs h1 → updateElement 재귀 호출
     * //      같은 타입 → h1 재사용, children 비교
     *
     * // i=1: p vs p → updateElement 재귀 호출
     * //      같은 타입 → p 재사용, children 비교
     *
     * // i=2: undefined vs span → updateElement 재귀 호출
     * //      케이스 1: oldNode만 있음 → span 제거
     *
     * // 결과: <div><h1>A'</h1><p>B'</p></div>
     */

    // ----------------------------------------
    // 남은 자식 노드 제거 (역순으로!)
    // ----------------------------------------
    //
    // oldLength > newLength: 이전에 더 많은 자식이 있었음
    // 예: 5개 → 3개: 4번, 3번 인덱스 제거
    //
    // 왜 역순으로 제거하는가?
    // - 정순: 앞에서 제거하면 뒤 인덱스가 변경됨
    // - 역순: 뒤에서 제거하면 앞 인덱스는 안전함
    if (oldLength > newLength) {
      for (let i = oldLength - 1; i >= newLength; i--) {
        const child = targetElement.childNodes[i];
        if (child) {
          targetElement.removeChild(child);
        }
      }
    }

    /*
     * 역순 제거의 중요성:
     *
     * // Old: <ul><li>A</li><li>B</li><li>C</li><li>D</li></ul>
     * // New: <ul><li>A</li><li>B</li></ul>
     *
     * // oldLength = 4, newLength = 2
     * // C와 D를 제거해야 함 (인덱스 2, 3)
     *
     * // ❌ 정순 제거 (잘못됨):
     * for (let i = 2; i < 4; i++) {
     *   ul.removeChild(ul.childNodes[i]);
     * }
     * // i=2: C 제거 → [A, B, D] (D가 인덱스 2로 이동!)
     * // i=3: childNodes[3]은 없음! → D가 남음
     *
     * // ✅ 역순 제거 (올바름):
     * for (let i = 3; i >= 2; i--) {
     *   ul.removeChild(ul.childNodes[i]);
     * }
     * // i=3: D 제거 → [A, B, C]
     * // i=2: C 제거 → [A, B]
     * // 완벽!
     */
  }
}

/*
 * ===================================
 * 전체 Diff 알고리즘 실행 예시
 * ===================================
 *
 * // Old:
 * <div className="container">
 *   <h1>Count: 0</h1>
 *   <ul>
 *     <li>Item 1</li>
 *     <li>Item 2</li>
 *     <li>Item 3</li>
 *   </ul>
 *   <p>Total: 3</p>
 * </div>
 *
 * // New:
 * <div className="wrapper">
 *   <h1>Count: 5</h1>
 *   <ul>
 *     <li>Item 1</li>
 *     <li>Item 2 Updated</li>
 *   </ul>
 *   <p>Total: 2</p>
 *   <button>Reset</button>
 * </div>
 *
 * updateElement(container, newDiv, oldDiv, 0);
 *
 * // === 실행 과정 ===
 *
 * // 1. div 비교
 * // - type: "div" === "div" ✓ (재사용)
 * // - updateAttributes(div, { className: "wrapper" }, { className: "container" })
 * //   → div.className = "wrapper"
 *
 * // 2. div의 children 비교
 * // maxLength = max(4, 4) = 4
 *
 * // i=0: h1 vs h1
 * //   - type 같음 ✓ (재사용)
 * //   - children: ["Count: 0"] vs ["Count: 5"]
 * //     → textContent = "Count: 5"
 *
 * // i=1: ul vs ul
 * //   - type 같음 ✓ (재사용)
 * //   - ul의 children 비교
 * //     maxLength = max(3, 2) = 3
 * //
 * //     i=0: li("Item 1") vs li("Item 1") → 동일, 유지
 * //     i=1: li("Item 2") vs li("Item 2 Updated")
 * //          → textContent = "Item 2 Updated"
 * //     i=2: undefined vs li("Item 3")
 * //          → removeChild(li[2])
 *
 * // i=2: p vs p
 * //   - type 같음 ✓ (재사용)
 * //   - children: ["Total: 3"] vs ["Total: 2"]
 * //     → textContent = "Total: 2"
 *
 * // i=3: undefined vs button
 * //   - newNode만 있음 (케이스 2)
 * //   → appendChild(createElement(button))
 *
 * // === 최종 DOM 조작 ===
 *
 * 총 6번의 조작:
 * 1. div.className = "wrapper"
 * 2. h1의 textContent = "Count: 5"
 * 3. li[1]의 textContent = "Item 2 Updated"
 * 4. ul.removeChild(li[2])
 * 5. p의 textContent = "Total: 2"
 * 6. div.appendChild(button)
 *
 * 재사용된 요소:
 * - div (최상위)
 * - h1
 * - ul
 * - li[0], li[1]
 * - p
 *
 * 새로 생성된 요소:
 * - button (1개만!)
 *
 * 제거된 요소:
 * - li[2] (1개만!)
 *
 * 결과: 최소한의 DOM 조작으로 효율적인 업데이트!
 * 전체를 다시 만들지 않음 → 빠른 성능 + 부드러운 UX
 */
