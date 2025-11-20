/**
 * JSX를 가상 DOM 객체(vNode)로 변환하는 함수
 *
 * Babel이 JSX를 변환할 때 자동으로 호출됩니다.
 * 예: <div className="box">Hello</div>
 *  → createVNode("div", { className: "box" }, "Hello")
 *
 * @param {string|function} type - HTML 태그명 (예: "div", "span") 또는 컴포넌트 함수
 * @param {Object|null} props - 속성 객체 (예: { className: "box", id: "main" })
 * @param {...any} children - 자식 요소들 (가변 인자로 받음)
 * @returns {Object} vNode 객체 { type, props, children }
 *
 * @example
 * // JSX: <button className="btn" onClick={handler}>Click</button>
 * // 변환: createVNode("button", { className: "btn", onClick: handler }, "Click")
 * // 결과: { type: "button", props: { className: "btn", onClick: handler }, children: ["Click"] }
 */
export function createVNode(type, props, ...children) {
  // children 배열을 평탄화(flatten)하고 falsy 값 제거
  //
  // 왜 필요한가?
  // 1. 배열 평탄화: JSX에서 map 사용 시 중첩 배열이 생성될 수 있음
  //    예: [["item1", "item2"], ["item3"]] → ["item1", "item2", "item3"]
  //
  // 2. falsy 값 제거: 조건부 렌더링에서 false, null, undefined가 포함될 수 있음
  //    예: {isVisible && <div>Content</div>} → isVisible이 false면 false 값이 children에 포함됨
  //    이런 값들은 화면에 렌더링되지 않아야 하므로 제거
  const flattenChildren = children
    .flat(Infinity) // Infinity: 중첩 깊이와 관계없이 완전히 평탄화
    .filter(
      (child) =>
        child !== null && // null 제거
        child !== undefined && // undefined 제거
        child !== false && // false 제거 (조건부 렌더링)
        child !== true, // true 제거 (조건부 렌더링)
    );

  // vNode 객체 반환
  // 이 객체는 나중에 normalizeVNode를 거쳐 정규화되고,
  // createElement로 실제 DOM 요소로 변환됩니다.
  return {
    type, // 요소 타입 (HTML 태그명 또는 컴포넌트 함수)
    props, // 속성 객체 (className, onClick 등)
    children: flattenChildren, // 정리된 자식 요소 배열
  };
}

/*
 * 실제 사용 예시:
 *
 * // 1. 단순한 요소
 * <div>Hello</div>
 * → createVNode("div", null, "Hello")
 * → { type: "div", props: null, children: ["Hello"] }
 *
 * // 2. 속성이 있는 요소
 * <button className="btn" disabled={true}>Click</button>
 * → createVNode("button", { className: "btn", disabled: true }, "Click")
 * → { type: "button", props: { className: "btn", disabled: true }, children: ["Click"] }
 *
 * // 3. 중첩된 요소
 * <div>
 *   <h1>Title</h1>
 *   <p>Content</p>
 * </div>
 * → createVNode("div", null,
 *     createVNode("h1", null, "Title"),
 *     createVNode("p", null, "Content")
 *   )
 * → {
 *     type: "div",
 *     props: null,
 *     children: [
 *       { type: "h1", props: null, children: ["Title"] },
 *       { type: "p", props: null, children: ["Content"] }
 *     ]
 *   }
 *
 * // 4. 배열 평탄화가 필요한 경우
 * <ul>
 *   {items.map(item => <li key={item.id}>{item.name}</li>)}
 * </ul>
 * → createVNode("ul", null,
 *     [li1, li2, li3]  // map이 배열을 반환
 *   )
 * → flat(Infinity)로 [li1, li2, li3]으로 평탄화
 *
 * // 5. 조건부 렌더링
 *
 * // JSX에서 조건부 렌더링:
 * <div>
 *   {isLoggedIn && <UserMenu />}
 *   {!isLoggedIn && <LoginButton />}
 * </div>
 *
 * // JavaScript의 && 연산자 동작:
 * // - true && <UserMenu /> → <UserMenu /> (두 번째 값 반환)
 * // - false && <UserMenu /> → false (첫 번째 값 반환)
 *
 * // === 시나리오 1: isLoggedIn = true ===
 * // JSX 평가:
 * // {true && <UserMenu />}   → <UserMenu /> (컴포넌트)
 * // {!true && <LoginButton />} → {false && <LoginButton />} → false
 *
 * // Babel 변환:
 * createVNode("div", null,
 *   <UserMenu />,  // 첫 번째 자식
 *   false          // 두 번째 자식
 * )
 *
 * // filter 처리:
 * // children = [<UserMenu />, false]
 * // → false 제거
 * // → children = [<UserMenu />]
 *
 * // 최종 결과: <div><UserMenu /></div>
 *
 * // === 시나리오 2: isLoggedIn = false ===
 * // JSX 평가:
 * // {false && <UserMenu />}  → false
 * // {!false && <LoginButton />} → {true && <LoginButton />} → <LoginButton />
 *
 * // Babel 변환:
 * createVNode("div", null,
 *   false,          // 첫 번째 자식
 *   <LoginButton /> // 두 번째 자식
 * )
 *
 * // filter 처리:
 * // children = [false, <LoginButton />]
 * // → false 제거
 * // → children = [<LoginButton />]
 *
 * // 최종 결과: <div><LoginButton /></div>
 *
 * // 핵심 포인트:
 * // 1. JSX의 {} 안에서 JavaScript 표현식이 평가됨
 * // 2. && 연산자는 조건에 따라 false 또는 컴포넌트를 반환
 * // 3. createVNode의 filter가 false를 제거
 * // 4. 결과적으로 조건에 맞는 컴포넌트만 렌더링됨
 */
