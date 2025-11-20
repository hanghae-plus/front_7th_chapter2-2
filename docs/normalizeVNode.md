## 파일: `src/lib/normalizeVNode.js`

### 1. 이 파일이 하는 일을 한 줄로 말하면

**여러 가지 형태로 섞여 들어오는 vNode/값들을, 렌더링하기 좋은 깔끔한 형태로 정리(normalize)하는 함수**입니다.  
숫자/문자열/함수 컴포넌트/일반 VNode 를 모두 한 규칙으로 맞춰 줍니다.

---

### 2. 현재 버전 `normalizeVNode` 코드 흐름 (간단 정리)

```js
export function normalizeVNode(vNode) {
  // 1) null / undefined / boolean → "" (화면에 안 보여야 하는 값)
  if (vNode === null || vNode === undefined || typeof vNode === "boolean") {
    return "";
  }

  // 2) string / number → 문자열 하나로 통일
  if (typeof vNode === "string" || typeof vNode === "number") {
    return String(vNode);
  }

  // 3) 함수 컴포넌트인 경우: 한 번 실행하고, 결과를 다시 normalizeVNode 에 넣기
  if (typeof vNode.type === "function") {
    const result = vNode.type({
      ...(vNode.props || {}),
      children: vNode.children,
    });

    return normalizeVNode(result);
  }

  // 4) 그 외 일반 VNode 객체: children 각각을 재귀적으로 정리하고, 쓸모없는 값은 필터링
  return {
    ...vNode,
    children: (vNode.children || [])
      .map((child) => normalizeVNode(child))
      .filter((child) => child && child !== ""),
  };
}
```

요약하면:

- **프리미티브 값들**(null/undefined/boolean/number/string)을 안전하게 텍스트 형태로 통일하고,
- **함수 컴포넌트**는 “한 번 실행 + 결과를 재귀적으로 정리”만 딱 한 번 하고,
- **일반 VNode**는 children 을 재귀 정리한 뒤, `null/undefined/""` 같은 값은 걸러냅니다.

---

### 3. 이전 커밋(옛날 버전) `normalizeVNode` 와의 차이

옛날 버전(커밋 기준)은 대략 이렇게 생겼습니다:

```js
export function normalizeVNode(vNode) {
  if (vNode === null || vNode === undefined || typeof vNode === "boolean") {
    return "";
  }
  if (typeof vNode === "string" || typeof vNode === "number") {
    return String(vNode);
  }
  if (Array.isArray(vNode)) {
    return vNode.map(normalizeVNode).join("");
  }
  if (typeof vNode === "object" && vNode !== null) {
    // 함수 컴포넌트인 경우 실행
    if (typeof vNode.type === "function") {
      const props = { ...(vNode.props || {}), children: vNode.children || [] };
      const componentResult = vNode.type(props);

      const normalized = normalizeVNode(componentResult);

      if (
        normalized &&
        typeof normalized === "object" &&
        Array.isArray(normalized.children)
      ) {
        normalized.children = normalized.children.map(normalizeVNode);
      }

      return normalized;
    }

    // 일반 엘리먼트인 경우 children 정규화
    if (vNode.children) {
      const normalizedChildren = vNode.children.map(normalizeVNode);
      return {
        ...vNode,
        children: normalizedChildren,
      };
    }

    return vNode;
  }
  return vNode;
}
```

#### 3-1. 배열 처리 방식의 차이

- **옛날 버전**: `Array.isArray(vNode)` 이면

  ```js
  return vNode.map(normalizeVNode).join("");
  ```

  즉, 배열을 정리한 뒤 **문자열 하나로 합쳐 버립니다.**

- **현재 버전**: 최상위에서 배열을 직접 다루지 않고,
  - JSX → `createVNode` 단계에서 children 을 평탄화/필터링하고
  - `normalizeVNode` 에서는 항상 “VNode 객체 또는 프리미티브 값”만 처리합니다.

#### 3-2. 함수 컴포넌트 처리 방식의 차이

- **옛날 버전**:
  - `props = { ...(vNode.props || {}), children: vNode.children || [] }` 로 **children 을 항상 배열**로 만들어 함수 컴포넌트에 넘김.
  - `componentResult` 를 `normalizeVNode` 로 한 번 정리한 뒤,
  - 그 결과가 객체이고 `children` 이 배열이면, 그 children 에 대해 `normalizeVNode` 를 **한 번 더** 돌림 → 이중 정규화.

- **현재 버전**:

  ```js
  if (typeof vNode.type === "function") {
    const result = vNode.type({ ...(vNode.props || {}), children: vNode.children });
    return normalizeVNode(result);
  }
  ```

  - props.children 을 그대로 넘기고,
  - 함수 결과에 대해 `normalizeVNode` 를 **한 번만** 수행합니다.

#### 3-3. 일반 VNode children 정리 차이

- **옛날 버전**:
  - `vNode.children.map(normalizeVNode)` 만 하고,  
    `null/undefined/""` 같은 값은 별도로 필터링하지 않았습니다.

- **현재 버전**:

  ```js
  children: (vNode.children || [])
    .map((child) => normalizeVNode(child))
    .filter((child) => child && child !== ""),
  ```

  - children 각각을 정리한 다음,
  - falsy 값 및 빈 문자열을 제거해서 **렌더링하기 좋은 children 배열**만 남깁니다.

---

### 4. 왜 옛날 버전으로 되돌리면 `상품 상세 페이지 워크플로우` E2E 테스트가 깨지는가?

관련 테스트: `e2e/e2e.spec.js` 의  
**"4. 상품 상세 페이지 워크플로우" (380–447 라인 근처)** 입니다.

이 테스트는 다음을 검증합니다:

1. 홈에서 `"PVC 투명 젤리 쇼핑백"` 카드를 클릭해 상세 페이지로 이동.
2. 상세 페이지에서:
   - `상품 상세` 텍스트,
   - 정확한 h1(상품명),
   - 수량 증가, 장바구니 담기 동작,
   - 토스트 메시지
   를 확인.
3. 관련 상품 카드 중 첫 번째를 클릭 → **샷시 풍지판 상세 페이지**로 이동.
4. 이 상태에서:
   - URL, h1 텍스트, `window.loadFlag` 값 등을 확인.
5. `page.reload()` 후에도:
   - 여전히 같은 상품 상세 페이지가 보이고,
   - `window.loadFlag` 가 `undefined` 로 초기화되었는지를 확인.

이 흐름은 내부적으로:

- `renderElement(<PageComponent />, #root)` 호출,
- 그 안에서 `normalizeVNode` 가 함수 컴포넌트(PageWrapper, HomePage, ProductDetailPage 등)를 풀어내고,
- children 트리를 정리한 뒤,
- `createElement` / `updateElement` 로 DOM 을 만드는 구조에 의존합니다.

#### 4-1. 옛날 버전이 문제를 만드는 지점 ① – 배열을 문자열로 합치는 로직

옛날 버전에는 다음 로직이 있습니다:

```js
if (Array.isArray(vNode)) {
  return vNode.map(normalizeVNode).join("");
}
```

이 말은,

- 어떤 함수 컴포넌트가 **배열을 루트로 리턴**하면  
  (예: `return [<Header />, <Main />]`)
- 이 배열은 normalize 과정에서 `"..."` **텍스트 하나로 합쳐져 버립니다.**

그 결과:

- 상위 VNode 입장에서는 원래 `<Header />`, `<Main />` 이 들어있어야 할 위치에  
  그냥 `"문자열 한 덩어리"` 만 남게 됩니다.
- 특히 `PageWrapper` 나 `ProductDetailPage` 가 children 을 배열 형태로 리턴하는 부분이 있다면,
  - 상세 페이지의 구조(헤더/h1/관련 상품 섹션 등)가  
    기대와 다르게 깨진 DOM 으로 만들어질 수 있습니다.

#### 4-2. 옛날 버전이 문제를 만드는 지점 ② – 함수 컴포넌트 children 이 이중 정규화됨

옛날 버전 함수 컴포넌트 처리:

```js
if (typeof vNode.type === "function") {
  const props = { ...(vNode.props || {}), children: vNode.children || [] };
  const componentResult = vNode.type(props);

  const normalized = normalizeVNode(componentResult);

  if (
    normalized &&
    typeof normalized === "object" &&
    Array.isArray(normalized.children)
  ) {
    normalized.children = normalized.children.map(normalizeVNode);
  }

  return normalized;
}
```

- 첫 번째 `normalizeVNode(componentResult)` 에서 이미 전체 트리를 정리한 뒤,
- 그 결과의 `children` 배열에 대해서 또 한 번 `normalizeVNode` 를 적용합니다.

이렇게 되면:

- children 안의 컴포넌트/텍스트들이 **불필요하게 두 번씩 정리**되고,
- 어떤 경우에는:
  - children 이 프리미티브 문자열로 내려갔다가 다시 한번 normalize 되면서 모양이 예상과 달라지고,
  - 상세 페이지의 특정 섹션(예: h1, 관련 상품 카드, `상품 상세` 타이틀 등)이  
    테스트에서 기대하는 구조와 달라질 수 있습니다.

결과적으로:

- `e2e` 테스트가 기대하는 ARIA 스냅샷 / `toBeVisible` 조건과,
- 실제 렌더링된 DOM 의 구조가 어긋나서  
**"상품 상세 페이지 워크플로우" 테스트가 실패**하게 됩니다.

#### 4-3. 현재 버전이 이 문제를 피하는 이유

- 배열을 최상위에서 문자열로 합쳐 버리는 로직(`Array.isArray(vNode) → join("")`)을 제거했습니다.
- 함수 컴포넌트는:

  ```js
  if (typeof vNode.type === "function") {
    const result = vNode.type({ ...(vNode.props || {}), children: vNode.children });
    return normalizeVNode(result);
  }
  ```

  처럼 **한 번만** 정리합니다.

- 일반 VNode 의 children 은:
  - `map(normalizeVNode)` 후,
  - `filter(child && child !== "")` 로 쓸모없는 값 제거만 수행합니다.

이렇게 단순화된 규칙 덕분에:

- 상세 페이지 / 관련 상품 / 라우팅 재렌더링 시에도  
  DOM 구조가 안정적으로 유지되고,
- `e2e/e2e.spec.js` 의  
  **"4. 상품 상세 페이지 워크플로우" 테스트가 통과**하게 됩니다.

요약하면,

> 옛날 `normalizeVNode` 로 되돌리면  
> 배열 → 문자열 합치기 + 함수 컴포넌트 children 이중 정규화 때문에  
> 상세 페이지 DOM 구조가 변형되고,  
> 그 결과 E2E 테스트가 기대하는 구조와 달라져서 테스트가 깨집니다.

---

### 5. `createVNode` 와 함께 사용할 때의 역할 분담 (요약)

`normalizeVNode` 는 `createVNode` 와 함께 사용할 때도 **역할이 명확히 나뉩니다.**

- **`createVNode`**
  - JSX처럼 생긴 코드를 받아서 **“이런 태그 + 이런 props + 이런 children”** 이라는 VNode 객체를 만듭니다.
  - children 쪽은 주로 **배열 평탄화/필터링**을 통해, 나중에 다루기 쉬운 배열 형태로 정리하는 쪽에 가깝습니다.

- **`normalizeVNode`**
  - 이렇게 만들어진 VNode / 값들을
    - `null / undefined / boolean` → `""`
    - `number / string` → 문자열
    - 함수 컴포넌트 → 한 번 실행 후 결과를 재귀적으로 정규화
    - 일반 VNode → children 을 재귀적으로 정리 + 쓸모없는 값 필터링
  - 규칙에 맞게 **최종 렌더링 직전에 한 번 더 정규화**해 줍니다.

실제로 사용하는 흐름(`createVNode` → `normalizeVNode` → 렌더링)에서는  
입력은 좀 지저분해도, 최종적으로는 **렌더링하기 좋은 VNode 트리**만 남도록  
두 함수가 서로 역할을 나눠서 협업하고 있다고 보면 됩니다.


