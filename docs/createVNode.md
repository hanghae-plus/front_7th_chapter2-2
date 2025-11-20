## 파일: `src/lib/createVNode.js`

### 1. 이 파일이 하는 일을 한 줄로 말하면

**JSX처럼 생긴 코드 → “화면 설계도(VNode)” 객체로 바꿔 주는 함수**입니다.  
특히 `children`(자식들) 안에 있는 **중첩 배열 / 필요 없는 값(null, false 등)** 을 깔끔하게 정리해 줍니다.

---

### 2. 코드 흐름, 진짜 쉽게 풀어서 설명

- 맨 위에 `flatten` 이라는 함수가 있습니다.
  - 배열 안에 배열이 또 있을 때, 이걸 **한 줄로 쭉 펼쳐 주는** 함수입니다.
  - `null`, `false`, `true` 같은 “그리지 않을 값”은 빼고 담습니다.

- `createVNode(type, props, ...children)` 함수가 핵심입니다.
  - `type` : `"div"`, `"span"` 같은 태그 이름이거나, 함수 컴포넌트일 수 있습니다.
  - `props` : `className`, `onClick`, `id` 같은 속성들입니다.
  - `children` : 태그 안에 들어가는 내용들입니다.
    - 예: `<div><span>안녕</span></div>` 에서 `<span>안녕</span>` 부분.
  - 구현에서는:
    - `children.flat(Infinity)` 로 **모든 중첩 배열을 납작하게 펴고**
    - `null`, `undefined`, `false`, `true` 인 값은 `filter` 로 제거합니다.
  - 이렇게 하면:
    - 나중에 렌더링할 때 다루기 쉬운, **깔끔한 children 배열**이 만들어집니다.

요약하면:

- `createVNode` 는 **“이런 태그 + 이런 속성 + 이런 자식들”** 이라는 정보를
- **정리된 하나의 자바스크립트 객체**로 만들어서 넘겨주는 역할을 합니다.

---

### 2-1. 옛날 `flatten` 과 지금 `normalizeChildren` 은 기능이 같은가?

과거에 사용하던 `flatten` 함수는:

- 배열이면 재귀 호출해서 **중첩 배열을 한 줄로 펼치고**
- 배열이 아닌 값이면:
  - `null`, `undefined`, `false`, `true` 는 버리고
  - 나머지는 결과 배열에 그대로 넣는 역할을 했습니다.

지금 코드에서 사용하는 `normalizeChildren` 은:

- `children.flat(Infinity)` 으로 모든 중첩 배열을 한 번에 평탄화하고
- 그 다음 `filter` 로 `null`, `undefined`, `false`, `true` 를 제거합니다.

같은 입력을 예로 들면:

- 입력: `[1, [2, null, [3, false]], true, "hi"]`
- 옛날 `flatten(children)` → `[1, 2, 3, "hi"]`
- 지금 `normalizeChildren(children)` → `[1, 2, 3, "hi"]`

즉, **실제로 하는 일(동작 결과)은 거의 동일**합니다.  
현재 구현은 “직접 재귀 돌리는 flatten” 대신,  
`flat + filter` 를 이용해 같은 동작을 더 간단하게 표현한 버전이라고 이해하면 됩니다.

---

### 3. 리팩터링 아이디어 3가지

#### 아이디어 1) 안 쓰는 `flatten` 정리하거나, 아예 공식 도구로 쓰기

- 지금은 `flatten` 함수가 선언만 되어 있고, 실제로는 `children.flat(Infinity)` 를 사용하고 있습니다.
- 선택지는 두 가지입니다.
  - **(1) 완전히 삭제**
    - 지금처럼 `flat + filter` 조합이 더 읽기 쉽고, 실제로 쓰이니  
      `flatten` 자체를 제거하면 코드가 더 단순해집니다.
  - **(2) `flat` 대신 `flatten` 을 공식 도구로 사용**
    - `children.flat(Infinity)` 대신 `flatten(children)` 을 쓰면:
      - 브라우저 호환성(오래된 환경)도 조금 더 좋아지고,
      - “children을 평탄화하고 필터링하는 책임”이 한 곳에 모입니다.

#### 아이디어 2) `children` 정리를 전담하는 헬퍼로 분리하기

- 지금은 `createVNode` 안에서 바로:
  - `flat(Infinity)` + `filter(...)` 를 쓰고 있습니다.
- 대신 아래처럼 **전담 함수**를 만드는 방법이 있습니다.

```js
function normalizeChildren(children) {
  return children
    .flat(Infinity)
    .filter(
      (child) =>
        child !== null &&
        child !== undefined &&
        child !== false &&
        child !== true
    );
}
```

그리고 `createVNode` 에서는:

```js
children: normalizeChildren(children),
```

만 쓰면 됩니다.

- 장점:
  - 나중에 children 규칙이 바뀌어도 `normalizeChildren` 만 수정하면 됨.
  - 테스트도 이 헬퍼만 따로 만들 수 있어서 **코드 이해와 디버깅이 더 쉬워집니다.**

#### 아이디어 3) `createVNode` 는 “생성만”, 정리는 `normalizeVNode` 에게 넘기기

- 지금은 `createVNode` 가 children을 이미 꽤 정리해서 넘기고 있습니다.
- 다른 방식으로는:
  - `createVNode` 는 “그냥 받은 값 그대로” VNode 로 감싸기만 하고,
  - `children` 안에 있는 `null/false` 제거, 평탄화는  
    **전부 `normalizeVNode` 한 곳에서만** 처리하도록 할 수도 있습니다.
- 장점:
  - “정규화/정리” 라는 책임이 완전히 `normalizeVNode` 에 모이므로,
  - 나중에 데이터 흐름을 따라가기가 더 직관적일 수 있습니다.
- 단점:
  - `normalizeVNode` 가 하는 일이 더 많아져서,  
    파일 하나가 너무 비대해질 수 있습니다.
