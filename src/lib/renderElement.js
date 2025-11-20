import { setupEventListeners } from "./eventManager";
import { createElement } from "./createElement";
import { normalizeVNode } from "./normalizeVNode";
import { updateElement } from "./updateElement";

/**
 * Virtual DOM을 실제 DOM으로 렌더링하는 메인 함수
 *
 * React의 ReactDOM.render()와 유사한 역할을 합니다.
 * 최초 렌더링과 재렌더링을 구분하여 처리합니다.
 *
 * @param {any} vNode - 렌더링할 vNode (컴포넌트 또는 JSX)
 * @param {Element} container - vNode를 렌더링할 DOM 컨테이너 (보통 #app 또는 #root)
 *
 * @example
 * // 최초 렌더링
 * const app = document.getElementById('app');
 * renderElement(<App />, app);
 *
 * // 상태 변경 후 재렌더링
 * renderElement(<App />, app); // Diff 알고리즘으로 변경된 부분만 업데이트
 *
 * 처리 흐름:
 * 1. vNode 정규화 (컴포넌트 실행, 타입 변환)
 * 2. 최초 vs 재렌더링 판단
 * 3. 최초: createElement로 새로 생성
 *    재렌더링: updateElement로 차이점만 업데이트
 * 4. vNode 저장 (다음 비교용)
 * 5. 이벤트 위임 설정
 */
export function renderElement(vNode, container) {
  // ========================================
  // 1단계: vNode 정규화
  // ========================================
  //
  // 왜 정규화가 필요한가?
  // - vNode는 다양한 형태일 수 있음:
  //   * 함수형 컴포넌트: { type: function, ... }
  //   * 배열: [vNode1, vNode2, ...]
  //   * 숫자: 42
  //   * 문자열: "Hello"
  //
  // normalizeVNode가 하는 일:
  // - 함수형 컴포넌트 실행
  // - 숫자 → 문자열 변환
  // - 배열 평탄화
  // - null/boolean 제거
  //
  // 결과: createElement가 처리할 수 있는 표준 형식
  const normalizedVNode = normalizeVNode(vNode);

  // ========================================
  // 2단계: 최초 렌더링 vs 재렌더링 판단
  // ========================================
  //
  // container._vNode: 이전에 렌더링한 vNode를 저장
  //
  // - undefined: 최초 렌더링 (처음 renderElement 호출)
  // - 있음: 재렌더링 (두 번째 이상 호출)
  const oldVNode = container._vNode;

  if (!oldVNode) {
    // ----------------------------------------
    // 최초 렌더링: 전체 DOM 새로 생성
    // ----------------------------------------
    //
    // 왜 innerHTML = ""?
    // - 컨테이너에 기존 HTML이 있을 수 있음
    //   (예: index.html에 <div id="app">Loading...</div>)
    // - 기존 내용을 모두 제거하고 새로 시작
    container.innerHTML = "";

    // createElement: vNode → 실제 DOM 요소로 변환
    // 재귀적으로 모든 자식 요소들도 생성
    const element = createElement(normalizedVNode);

    // 생성한 DOM을 컨테이너에 추가
    container.appendChild(element);

    /*
     * 예시:
     * vNode = { type: "div", props: { className: "app" }, children: [...] }
     * → element = <div class="app">...</div>
     * → container.appendChild(element)
     *
     * 결과:
     * <div id="app">
     *   <div class="app">...</div>
     * </div>
     */
  } else {
    // ----------------------------------------
    // 재렌더링: Diff 알고리즘으로 차이점만 업데이트
    // ----------------------------------------
    //
    // 왜 전체를 다시 만들지 않는가?
    // - DOM 조작은 비용이 큼 (느림)
    // - 변경된 부분만 업데이트하는 것이 훨씬 빠름
    // - 사용자 경험 향상 (input focus 유지, 애니메이션 유지 등)
    //
    // updateElement가 하는 일:
    // - oldVNode와 normalizedVNode 비교
    // - 차이점 찾기 (Diff 알고리즘)
    // - 최소한의 DOM 조작으로 업데이트
    //   * 텍스트만 변경: textContent 업데이트
    //   * 속성만 변경: setAttribute
    //   * 노드 추가/제거: appendChild/removeChild
    updateElement(container, normalizedVNode, oldVNode);

    /*
     * 예시:
     * oldVNode = { type: "div", children: [{ type: "h1", children: ["Count: 0"] }] }
     * newVNode = { type: "div", children: [{ type: "h1", children: ["Count: 1"] }] }
     *
     * updateElement:
     * 1. div 비교 → 같은 타입, 재사용
     * 2. h1 비교 → 같은 타입, 재사용
     * 3. "Count: 0" vs "Count: 1" → 텍스트만 변경
     *
     * 결과: h1의 textContent만 "Count: 1"로 업데이트
     *       DOM 요소는 재생성하지 않음!
     */
  }

  // ========================================
  // 3단계: 현재 vNode 저장
  // ========================================
  //
  // 다음 renderElement 호출 시 비교용으로 사용
  //
  // container는 DOM 요소이므로 커스텀 속성 추가 가능
  // _vNode는 표준 속성이 아니지만 JavaScript 객체에 추가 가능
  //
  // 예시:
  // 1회차: container._vNode = undefined → normalizedVNode로 설정
  // 2회차: container._vNode = 1회차 vNode
  //        → oldVNode로 사용하여 비교
  //        → 새로운 normalizedVNode로 교체
  container._vNode = normalizedVNode;

  // ========================================
  // 4단계: 이벤트 리스너 설정 (위임 방식)
  // ========================================
  //
  // setupEventListeners: container에 이벤트 위임 설정
  //
  // 이미 설정되어 있으면?
  // - setupEventListeners 내부에서 중복 체크
  // - roots Set에 있으면 무시
  // - 최초 1회만 실제로 설정됨
  //
  // 왜 매번 호출하는가?
  // - 안전성: 혹시 설정 안 되어 있으면 설정
  // - 단순성: 코드 복잡도 낮춤
  // - 성능: roots.has() 체크는 매우 빠름 (O(1))
  setupEventListeners(container);
}

/*
 * renderElement 전체 흐름 예시:
 *
 * // 컴포넌트 정의
 * function Counter() {
 *   const [count, setCount] = useState(0);
 *
 *   return (
 *     <div className="counter">
 *       <h1>Count: {count}</h1>
 *       <button onClick={() => setCount(count + 1)}>
 *         Increment
 *       </button>
 *     </div>
 *   );
 * }
 *
 * // 앱 시작
 * const app = document.getElementById('app');
 *
 * // ===== 1회차 렌더링 (count = 0) =====
 * renderElement(<Counter />, app);
 *
 * // 1. normalizeVNode(<Counter />)
 * //    → Counter() 실행
 * //    → { type: "div", props: { className: "counter" }, children: [...] }
 *
 * // 2. oldVNode = undefined (최초)
 *
 * // 3. createElement 사용
 * //    → <div class="counter">
 * //        <h1>Count: 0</h1>
 * //        <button>Increment</button>
 * //      </div>
 *
 * // 4. app.appendChild(element)
 *
 * // 5. container._vNode = normalizedVNode 저장
 *
 * // 6. setupEventListeners(app) → 이벤트 위임 설정
 *
 *
 * // ===== 2회차 렌더링 (버튼 클릭 후, count = 1) =====
 * renderElement(<Counter />, app);
 *
 * // 1. normalizeVNode(<Counter />)
 * //    → Counter() 실행
 * //    → { type: "div", props: { className: "counter" }, children: [...] }
 * //    → h1의 children: ["Count: 1"] (변경됨!)
 *
 * // 2. oldVNode = 1회차의 vNode (app._vNode)
 *
 * // 3. updateElement 사용 (Diff)
 * //    - div: 같은 타입 → 재사용
 * //    - h1: 같은 타입 → 재사용
 * //    - "Count: 0" vs "Count: 1" → textContent만 변경
 * //    - button: 동일 → 유지
 *
 * // 4. 최소 DOM 조작:
 * //    h1의 firstChild.textContent = "Count: 1"
 * //    (단 1줄의 DOM 조작!)
 *
 * // 5. container._vNode = 새 vNode로 교체
 *
 * // 6. setupEventListeners(app) → 이미 설정됨, 무시
 *
 *
 * // 결과:
 * // - 전체 DOM 재생성 없음
 * // - h1의 텍스트만 변경
 * // - button의 포커스/상태 유지
 * // - 애니메이션 중단 없음
 * // - 매우 빠른 업데이트!
 */
