/**
 * vNode를 렌더링 가능한 일관된 형식으로 정규화(normalize)하는 함수
 *
 * createVNode가 생성한 다양한 형태의 vNode를
 * createElement가 처리할 수 있는 표준 형식으로 변환합니다.
 *
 * 처리하는 6가지 타입:
 * 1. null/undefined/boolean → 빈 문자열
 * 2. 숫자 → 문자열
 * 3. 문자열 → 그대로 반환
 * 4. 배열 → 재귀적으로 정규화
 * 5. 함수형 컴포넌트 → 실행 후 정규화
 * 6. 일반 vNode → children만 정규화
 *
 * @param {any} vNode - 정규화할 vNode (다양한 타입 가능)
 * @returns {string|Object|Array} 정규화된 vNode
 *
 * @example
 * // null/boolean → ""
 * normalizeVNode(null) // → ""
 * normalizeVNode(false) // → ""
 *
 * // 숫자 → 문자열
 * normalizeVNode(42) // → "42"
 *
 * // 컴포넌트 → 실행 후 정규화
 * normalizeVNode({ type: Welcome, props: {...}, children: [...] })
 * // → Welcome 함수 실행 → 결과를 다시 정규화
 */
export function normalizeVNode(vNode) {
  // ========================================
  // 케이스 1: null, undefined, boolean → 빈 문자열
  // ========================================
  //
  // 왜 필요한가?
  // - 조건부 렌더링: {isVisible && <div>Content</div>}
  //   isVisible이 false면 false 값이 전달됨
  // - 이런 값들은 화면에 아무것도 렌더링하지 않아야 함
  //
  // 왜 빈 문자열인가?
  // - null을 반환하면 나중에 처리가 복잡해짐
  // - 빈 문자열("")은 빈 텍스트 노드로 변환되어 안전하게 처리됨
  if (vNode == null || typeof vNode === "boolean") {
    return "";
  }

  // ========================================
  // 케이스 2: 숫자 → 문자열
  // ========================================
  //
  // 왜 필요한가?
  // - JSX에서 숫자를 직접 사용: <div>{42}</div>
  // - DOM 텍스트 노드는 문자열만 받을 수 있음
  // - 숫자를 문자열로 변환해야 함
  //
  // 예: <h1>Count: {count}</h1>
  //     count가 5면 → "5"로 변환
  if (typeof vNode === "number") {
    return String(vNode);
  }

  // ========================================
  // 케이스 3: 문자열 → 그대로 반환
  // ========================================
  //
  // 이미 렌더링 가능한 형태이므로 변환 불필요
  // 예: <div>Hello</div> → "Hello"는 그대로 사용
  if (typeof vNode === "string") {
    return vNode;
  }

  // ========================================
  // 케이스 4: 배열 → 각 요소를 정규화
  // ========================================
  //
  // 왜 배열이 나오는가?
  // - JSX에서 map 사용: {items.map(item => <li>{item}</li>)}
  // - 여러 요소를 반환할 때: [<div>A</div>, <div>B</div>]
  //
  // 처리 과정:
  // 1. 각 요소에 대해 normalizeVNode 재귀 호출
  // 2. 빈 문자열이나 null 제거 (의미 없는 값)
  if (Array.isArray(vNode)) {
    return vNode
      .map(normalizeVNode) // 각 요소를 재귀적으로 정규화
      .filter((child) => child !== "" && child != null); // 빈 값 제거
  }

  // ========================================
  // 케이스 5: 함수형 컴포넌트 → 실행하여 결과를 정규화
  // ========================================
  //
  // 함수형 컴포넌트란?
  // - props를 받아서 JSX를 반환하는 함수
  // - 예: function Welcome({ name }) { return <div>Hello {name}</div>; }
  //
  // 왜 이렇게 처리하는가?
  // - createVNode는 컴포넌트를 실행하지 않고 { type: function, ... } 형태로 저장
  // - normalizeVNode에서 실제로 컴포넌트를 실행
  // - React의 props.children 패턴을 구현하기 위해 children을 props에 포함
  if (typeof vNode.type === "function") {
    // children을 props에 포함시켜 전달
    //
    // 왜 children을 props에 넣는가?
    // - React 패턴: title, function Card({ children }) { ... }
    // - 컴포넌트 내부에서 props.children으로 접근 가능하게 하기 위함
    //
    // 예: <Card title="Hello"><p>Content</p></Card>
    //     → Card({ title: "Hello", children: [<p>Content</p>] })
    const props = {
      ...vNode.props, // 기존 props 복사 (title, className 등)
      children: vNode.children.length > 0 ? vNode.children : undefined,
      // children이 있으면 배열로 전달, 없으면 undefined
    };

    // 컴포넌트 함수 실행
    // 예: Welcome({ name: "John" }) → <div>Hello John</div>
    const result = vNode.type(props);

    // 실행 결과를 다시 정규화 (재귀 호출)
    // 왜 재귀 호출?
    // - 컴포넌트가 반환한 JSX도 정규화가 필요
    // - 컴포넌트 안에서 또 다른 컴포넌트를 사용할 수 있음 (중첩 컴포넌트)
    //
    // 예: Welcome 실행 → <div>...</div> (vNode)
    //     → 이 vNode의 children도 정규화 필요
    return normalizeVNode(result);
  }

  // ========================================
  // 케이스 6: 일반 vNode → children을 정규화
  // ========================================
  //
  // 일반 vNode란?
  // - type이 문자열인 HTML 요소: <div>, <span>, <button> 등
  // - 예: { type: "div", props: {...}, children: [...] }
  //
  // 왜 children만 정규화?
  // - type과 props는 이미 올바른 형태
  // - children은 다양한 타입이 섞여있을 수 있어서 정규화 필요
  //   (숫자, 문자열, 컴포넌트, 배열 등)
  return {
    ...vNode, // type과 props는 그대로 유지
    children: vNode.children
      .map(normalizeVNode) // 각 자식을 재귀적으로 정규화
      .filter((child) => child !== "" && child != null), // 빈 값 제거
  };
}

/*
 * 전체 흐름 예시:
 *
 * // 1. 컴포넌트 정의
 * function Card({ title, children }) {
 *   return (
 *     <div className="card">
 *       <h2>{title}</h2>
 *       <div className="content">{children}</div>
 *     </div>
 *   );
 * }
 *
 * // 2. JSX 사용 (isAvailable이 true라고 가정)
 * const isAvailable = true;
 *
 * <Card title="Product">
 *   <p>Price: {100}</p>
 *   {isAvailable && <button>Buy</button>}
 * </Card>
 *
 * // 3. createVNode 결과
 * // isAvailable이 true이므로: true && <button>Buy</button> → <button>Buy</button>
 * {
 *   type: Card,  // 함수
 *   props: { title: "Product" },
 *   children: [
 *     { type: "p", props: null, children: ["Price: ", 100] },
 *     { type: "button", props: null, children: ["Buy"] }  // button vNode!
 *   ]
 * }
 *
 * // 만약 isAvailable이 false였다면:
 * // false && <button>Buy</button> → false
 * // children: [..., false]  ← false가 들어감
 *
 * // 4. normalizeVNode 처리
 *
 * // 4-1. type이 함수이므로 케이스 5
 * const props = {
 *   title: "Product",
 *   children: [
 *     { type: "p", ... },
 *     { type: "button", ... }  // button vNode (true일 때)
 *   ]
 * };
 *
 * // 4-2. Card 함수 실행
 * const result = Card(props);
 * // → <div className="card">
 * //     <h2>Product</h2>
 * //     <div className="content">
 * //       {children}  ← 여기에 [p, button]이 렌더링됨
 * //     </div>
 * //   </div>
 *
 * // 4-3. 결과를 재귀적으로 정규화
 * // - div (케이스 6): children 정규화
 * //   - h2 (케이스 6): children ["Product"] → 그대로
 * //   - div.content (케이스 6): children 정규화
 * //     - p (케이스 6): children ["Price: ", 100] 정규화
 * //       - "Price: " (케이스 3): 그대로
 * //       - 100 (케이스 2): "100"으로 변환
 * //     - button (케이스 6): children ["Buy"] → 그대로
 *
 * // 5. 최종 정규화된 vNode
 * {
 *   type: "div",
 *   props: { className: "card" },
 *   children: [
 *     { type: "h2", props: null, children: ["Product"] },
 *     {
 *       type: "div",
 *       props: { className: "content" },
 *       children: [
 *         { type: "p", props: null, children: ["Price: ", "100"] },
 *         { type: "button", props: null, children: ["Buy"] }
 *       ]
 *     }
 *   ]
 * }
 *
 * // 모든 타입이 정규화되어 createElement가 처리할 수 있는 형태가 됨!
 */
