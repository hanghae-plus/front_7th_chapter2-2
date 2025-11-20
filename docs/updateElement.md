## 파일: `src/lib/updateElement.js`

### 1. 이 파일이 하는 일을 한 줄로 말하면

**이전 VNode vs 새 VNode 를 비교해서, 실제 DOM에서 “필요한 부분만” 수정하는 함수**입니다.  
추가/삭제/텍스트 변경/태그 변경/속성 변경/자식 비교까지 담당하는 핵심 diff 로직입니다.

---

### 2. 코드 흐름, 진짜 쉽게 풀어서 설명

이 파일에는 두 가지 주요 함수가 있습니다.

- `updateAttributes(target, originNewProps, originOldProps)`
- `updateElement(parentElement, newNode, oldNode, index = 0)`

#### 2-1. `updateAttributes` – 속성과 이벤트를 이전 상태에서 새 상태로 맞추기

함수 시그니처:

```js
function updateAttributes(target, newProps = {}, oldProps = {}) { ... }
```

- `target` : 실제 DOM 요소 (`<button>`, `<input>` 등)
- `newProps` : 새로 적용해야 할 props
- `oldProps` : 이전에 적용되어 있던 props

##### (1) 이전 + 새 props 를 한 번에 순회하면서 차이만 반영

```js
const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);

allKeys.forEach((key) => {
  if (key === "children" || key === "key") return;

  const prev = oldProps[key];
  const next = newProps[key];

  if (prev === next) {
    return; // 값이 완전히 같으면 아무 것도 하지 않음
  }

  // 이벤트 / className / boolean / 일반 속성을 각각 처리
});
```

리팩터링된 구현에서는:

- `oldProps` 와 `newProps` 의 key 를 `Set` 으로 합쳐서 **한 번의 루프** 안에서 비교/적용합니다.
- `children`, `key` 는 여전히 DOM 속성이 아니므로 건너뜁니다.
- 값이 완전히 같으면(`prev === next`) 아무 작업도 하지 않아 불필요한 DOM 업데이트를 줄입니다.

##### (2) 케이스별 처리 – 이벤트 / className / boolean / 일반 속성

- **이벤트(`onClick`, `onChange` 등)**:

  ```js
  if (key.startsWith("on")) {
    const eventType = key.slice(2).toLowerCase();
    if (typeof prev === "function") removeEvent(target, eventType, prev);
    if (typeof next === "function") addEvent(target, eventType, next);
    return;
  }
  ```

  - 이전 핸들러가 함수면 `removeEvent` 로 제거하고,
  - 새 값이 함수면 `addEvent` 로 다시 등록합니다.

- **`className`**:

  ```js
  if (key === "className") {
    if (next == null || next === "") {
      target.removeAttribute("class");
    } else {
      target.setAttribute("class", next);
    }
    return;
  }
  ```

  - 값이 비어 있으면 `class` 속성을 제거하고,
  - 그렇지 않으면 `class` 에 새 값을 설정합니다.

- **boolean 속성(`checked`, `disabled`, `selected`, `readOnly`)**:

  ```js
  if (BOOLEAN_PROPS.has(key)) {
    target[key] = !!next;
    return;
  }
  ```

  - `BOOLEAN_PROPS` 라는 `Set` 으로 모아두고,
  - DOM 프로퍼티(`target[key]`) 를 true/false 로 직접 설정합니다.

- **그 외 일반 속성**:

  ```js
  if (next == null) {
    target.removeAttribute(key);
  } else {
    target.setAttribute(key, next);
  }
  ```

  - 값이 `null` / `undefined` 이면 속성을 제거하고,
  - 그 외에는 `setAttribute` 로 새 값을 반영합니다.

요약하면:

- `updateAttributes` 는 “이전 props 와 새 props 를 한 번에 비교해서, 달라진 부분만 DOM 에 반영하는 함수”입니다.

#### 2-2. `updateElement` – VNode 트리를 비교해 DOM 트리를 수정하기

함수 시그니처:

```js
export function updateElement(parentElement, newNode, oldNode, index = 0) { ... }
```

- `parentElement` : 부모 DOM 요소
- `newNode` : 새 VNode (이번에 그리고 싶은 설계도)
- `oldNode` : 이전 VNode (지난번에 그렸던 설계도)
- `index` : `parentElement.childNodes` 에서 몇 번째 자식인지

##### (1) 노드 삭제 – 옛날에는 있었는데, 새 설계도에는 없음

```js
if (!newNode && oldNode) {
  return parentElement.removeChild(parentElement.childNodes[index]);
}
```

- 예: 예전에는 li가 3개였는데, 지금은 2개만 남음.
- 제거 대상이 된 DOM 자식을 `removeChild` 로 지웁니다.

##### (2) 노드 추가 – 새로 생긴 노드

```js
if (newNode && !oldNode) {
  return parentElement.appendChild(createElement(newNode));
}
```

- 예: 예전에는 li가 2개였는데, 지금은 3개가 됨.
- 새 VNode 로부터 DOM을 만들어서 `appendChild` 로 붙입니다.

##### (3) 텍스트 노드 변경

```js
const newIsText = typeof newNode === "string" || typeof newNode === "number";
const oldIsText = typeof oldNode === "string" || typeof oldNode === "number";

if (newIsText && oldIsText) {
  if (newNode !== oldNode) {
    parentElement.childNodes[index].textContent = newNode;
  }
  return;
}
```

- 두 노드 모두 문자열/숫자라면:
  - 내용이 다를 때만 `textContent` 를 새 값으로 바꿉니다.
- 예: `"사과"` → `"배"`

##### (4) 태그 타입이 바뀐 경우 – 통째로 교체

```js
if (newNode.type !== oldNode.type) {
  return parentElement.replaceChild(
    createElement(newNode),
    parentElement.childNodes[index]
  );
}
```

- 예: `<span>텍스트</span>` → `<strong>텍스트</strong>`
- 태그 이름이 달라졌으니, 기존 DOM 자식을 새로 만든 DOM으로 **통째로 교체**합니다.

##### (5) 타입이 같을 때 – 속성/자식을 최소 변경으로 업데이트

```js
const element = parentElement.childNodes[index];

updateAttributes(element, newNode.props || {}, oldNode.props || {});
```

- 먼저 같은 위치에 있는 실제 DOM 요소(`element`)를 가져옵니다.
- `updateAttributes` 를 호출해서:
  - 속성, 이벤트 핸들러를 이전 상태에서 새 상태로 맞춥니다.

```js
const newChildren = newNode.children || [];
const oldChildren = oldNode.children || [];

const minLength = Math.min(newChildren.length, oldChildren.length);
for (let i = 0; i < minLength; i++) {
  updateElement(element, newChildren[i], oldChildren[i], i);
}
```

- 공통 길이만큼은:
  - `updateElement` 를 재귀 호출해서
  - 각 자리에 있는 자식 VNode 들을 비교/업데이트합니다.

```js
if (newChildren.length > oldChildren.length) {
  for (let i = minLength; i < newChildren.length; i++) {
    element.appendChild(createElement(newChildren[i]));
  }
}
```

- 새 children 이 더 길면:
  - 공통 길이 이후에 있는 새 VNode 들을 DOM으로 만들어서 뒤에 추가합니다.

```js
if (oldChildren.length > newChildren.length) {
  for (let i = oldChildren.length - 1; i >= newChildren.length; i--) {
    element.removeChild(element.childNodes[i]);
  }
}
```

- 옛날 children 이 더 길면:
  - 남는 자식들을 **뒤에서부터 하나씩 제거**합니다.
  - 뒤에서부터 지우는 이유는:
    - 앞에서부터 지우면 인덱스가 계속 바뀌어서 헷갈리기 때문입니다.

요약하면:

- `updateElement` 는 “같은 위치의 노드들을 비교”해서
  - 삭제할 건 지우고,
  - 새로 생긴 건 추가하고,
  - 텍스트/속성/자식은 바뀐 부분만 최소한으로 수정하는 함수입니다.

---

### 3. 리팩터링 아이디어 3가지

#### 아이디어 1) `updateAttributes` 의 루프 구조를 더 명확하게 쪼개기

- 현재 구현은:
  - `Object.keys(originOldProps).forEach(...)` 안에서
  - 그 안에 다시 `Object.entries(originNewProps).forEach(...)` 가 들어가 있습니다.
- 논리적으로는:
  - “이전 것에서만 있는 key 지우기”
  - “새로운 값 적용하기”
  를 **완전히 분리된 두 단계**로 나누는 편이 더 이해하기 쉽습니다.

예:

```js
function updateAttributes(target, newProps = {}, oldProps = {}) {
  // 1. old 기준으로 삭제
  Object.keys(oldProps).forEach((key) => { ... });

  // 2. new 기준으로 추가/업데이트
  Object.entries(newProps).forEach(([key, value]) => { ... });
}
```

- 이렇게 하면:
  - 중첩 루프 없이, 각 단계가 명확해서
  - 나중에 읽는 사람이 “아, 여기선 삭제 / 여기선 추가구나” 를 바로 이해할 수 있습니다.

#### 아이디어 2) children 비교에 “key” 를 사용하는 방식으로 확장

- 지금은 children 을 **순서(index)** 기준으로만 비교합니다.
  - 예: 0번 vs 0번, 1번 vs 1번 …
- React 처럼:
  - 각 child 에 `key` 를 부여하고
  - “같은 key 를 가진 것끼리” 매칭해서 업데이트하면,
  - 리스트 중간에 원소가 추가/삭제되어도 최소한의 DOM 변경으로 처리할 수 있습니다.

아이디어:

- `newChildren` / `oldChildren` 을 `key` 기준 Map 으로 변환한 뒤,
- 공통 key / 추가된 key / 삭제된 key 를 나누어 처리하는 방식으로 확장할 수 있습니다.

#### 아이디어 3) 텍스트 노드를 별도 VNode 타입으로 통합 처리

- 지금은:
  - 문자열/숫자인 경우를 **특별 케이스**로 if 문에서 처리하고 있습니다.
- 다른 방식(React 스타일)로는:
  - 텍스트도 `{ type: TEXT_NODE, props: { nodeValue: "..." }, children: [] }` 같은 VNode 로 표현하고,
  - `updateElement` 가 항상 “객체 형태의 VNode”만 다루게 만들 수 있습니다.

장점:

- 조건문에서 “문자열/숫자 vs 객체”를 구분할 필요가 줄어듭니다.
- 텍스트도 VNode 객체로 통일되기 때문에,  
  - 타입 체크/분기 로직이 간단해질 수 있습니다.

단점:

- `createVNode`, `normalizeVNode`, `createElement` 등  
  다른 파일들도 TEXT_NODE 개념을 알도록 수정해야 하므로  
  리팩터링 범위가 꽤 넓어집니다.


