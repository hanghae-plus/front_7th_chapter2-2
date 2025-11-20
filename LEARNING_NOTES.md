# 학습 노트 - 가상돔 만들기 프로젝트

이 문서는 프로젝트 진행 중 질문하고 해결한 내용들을 주제별로 정리한 것입니다.

## 목차

1. [createVNode 함수 구현](#1-createvnode-함수-구현)
2. [normalizeVNode 함수 구현](#2-normalizevnode-함수-구현)
3. [Husky Pre-commit 훅 설정](#3-husky-pre-commit-훅-설정)
4. [조건부 렌더링과 Falsy 값 처리](#4-조건부-렌더링과-falsy-값-처리)
5. [이벤트 위임 (Event Delegation)](#5-이벤트-위임-event-delegation)
6. [renderElement와 DOM 렌더링](#6-renderelement와-dom-렌더링)

---

## 1. createVNode 함수 구현

### 1.1 기본 구조 생성

**요구사항**: JSX를 vNode 객체로 변환하는 함수 구현

**초기 구현**:

```javascript
export function createVNode(type, props, ...children) {
  return {};
}
```

**테스트 케이스**:

```javascript
const vNode = createVNode("div", { id: "test" }, "Hello");
expect(vNode).toEqual({
  type: "div",
  props: { id: "test" },
  children: ["Hello"],
});
```

**해결 방법**:

- `type`: 첫 번째 인자 (엘리먼트 타입 또는 함수 컴포넌트)
- `props`: 두 번째 인자 (속성 객체)
- `children`: 나머지 인자들을 배열로 수집

```javascript
export function createVNode(type, props, ...children) {
  return {
    type,
    props,
    children,
  };
}
```

### 1.2 배열 평탄화 (Flatten)

**요구사항**: 중첩된 배열을 평탄화해야 함

**테스트 케이스**:

```javascript
const vNode = createVNode("div", null, ["Hello", ["world", "!"]]);
expect(vNode.children).toEqual(["Hello", "world", "!"]);
```

**해결 방법**: 재귀적으로 배열을 평탄화하는 헬퍼 함수 추가

```javascript
function flatten(arr) {
  const result = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flatten(item)); // 재귀적으로 평탄화
    } else {
      result.push(item);
    }
  }
  return result;
}

export function createVNode(type, props, ...children) {
  return {
    type,
    props,
    children: flatten(children),
  };
}
```

### 1.3 Falsy 값 필터링

**요구사항**: 조건부 렌더링에서 falsy 값(null, undefined, false, true)을 children에서 제거

**테스트 케이스**:

```javascript
// 조건부 렌더링
<div>
  {true && <span>Shown</span>}
  {false && <span>Hidden</span>}
</div>
// expected: children에 <span>Shown</span>만 포함
```

**해결 방법**: flatten 함수에서 falsy 값 필터링

```javascript
function flatten(arr) {
  const result = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flatten(item));
    } else if (item != null && item !== false && item !== true) {
      // null, undefined, false, true 제외
      result.push(item);
    }
  }
  return result;
}
```

**핵심 포인트**:

- `item != null`: `null`과 `undefined` 모두 체크 (`item !== null && item !== undefined`와 동일)
- `item !== false && item !== true`: boolean 값 제외
- React처럼 조건부 렌더링에서 falsy 값은 무시됨

**🔗 React 내부 로직과의 연관성**:

- **React.createElement**: JSX가 변환되는 실제 함수
  - React 소스: `packages/react/src/ReactElement.js`
  - `React.createElement(type, props, ...children)` 형태로 JSX가 변환됨
  - children를 배열로 수집하고 정규화하는 과정이 포함됨
- **Children 정규화**: React는 `React.Children` 유틸리티로 children를 정규화
  - `React.Children.toArray()`: children를 배열로 변환하고 flatten
  - `React.Children.map()`: children를 순회하며 변환
- **Falsy 값 처리**: React는 렌더링 시 falsy 값(null, undefined, false, true)을 무시
  - `packages/react/src/ReactElement.js`의 `createElement` 함수에서 처리
  - 조건부 렌더링 `{condition && <element>}` 패턴 지원

---

## 2. normalizeVNode 함수 구현

### 2.1 정규화(Normalization)의 개념

**정규화란?**

- 함수 컴포넌트를 실행하여 실제 vNode 구조로 변환하는 과정
- 중첩된 컴포넌트들을 모두 실행하여 최종적으로 순수한 HTML 엘리먼트 vNode로 변환

**🔗 React 내부 로직과의 연관성**:

- **Reconciliation**: React의 핵심 알고리즘
  - React 소스: `packages/react-reconciler/src/ReactFiberReconciler.js`
  - 컴포넌트 트리를 순회하며 각 노드를 처리하는 과정
  - 우리의 `normalizeVNode`는 Reconciliation의 "렌더링 단계"를 단순화한 버전
- **Work Loop**: React는 work loop를 통해 컴포넌트를 순회하며 처리
  - `performSyncWorkOnRoot`: 동기 렌더링의 진입점
  - `workLoopSync`: 컴포넌트 트리를 순회하며 작업 수행
  - 각 컴포넌트는 `beginWork`에서 처리되고, children는 재귀적으로 처리됨

**예시**:

```javascript
// 입력: 함수 컴포넌트
<TestComponent />

// 과정:
// 1. TestComponent 실행 → <UnorderedList>...</UnorderedList>
// 2. UnorderedList 실행 → <ul>...</ul>
// 3. ListItem 실행 → <li>...</li>

// 출력: 순수한 HTML 엘리먼트 vNode
<ul>
  <li>...</li>
</ul>
```

### 2.2 기본 타입 처리

**요구사항**: 다양한 타입의 vNode를 처리

```javascript
export function normalizeVNode(vNode) {
  // 1. Falsy 값 처리
  if (vNode === null || vNode === undefined || typeof vNode === "boolean") {
    return "";
  }

  // 2. 문자열/숫자 처리
  if (typeof vNode === "string" || typeof vNode === "number") {
    return String(vNode);
  }

  // 3. 배열 처리
  if (Array.isArray(vNode)) {
    return vNode.map(normalizeVNode).join("");
  }

  // 4. 객체 처리 (vNode)
  if (typeof vNode === "object" && vNode !== null) {
    // 함수 컴포넌트 또는 일반 엘리먼트 처리
  }

  return vNode;
}
```

### 2.3 함수 컴포넌트 vs 일반 엘리먼트 구분

**왜 구분해야 하나?**

1. **함수 컴포넌트 = 실행해야 하는 템플릿**

   ```javascript
   const TestComponent = () => <div>Hello</div>;
   // vNode.type이 함수 → 아직 실행되지 않은 템플릿
   // 실행해야 실제 vNode 구조가 나옴
   ```

2. **일반 엘리먼트 = 이미 완성된 구조**
   ```javascript
   <div>Hello</div>
   // vNode.type이 문자열("div") → 이미 구조가 있음
   // 실행할 필요 없음
   ```

**구현**:

```javascript
if (typeof vNode === "object" && vNode !== null) {
  // 함수 컴포넌트인 경우
  if (typeof vNode.type === "function") {
    // 함수 컴포넌트 실행
    const componentResult = vNode.type(vNode.props || {});
    // 실행 결과를 재귀적으로 정규화
    return normalizeVNode(componentResult);
  }

  // 일반 엘리먼트인 경우
  // children만 정규화
  if (vNode.children) {
    const normalizedChildren = vNode.children.map(normalizeVNode);
    return {
      ...vNode,
      children: normalizedChildren,
    };
  }
}
```

**🔗 React 내부 로직과의 연관성**:

- **Element Type 판별**: React는 `typeof element.type === 'function'`으로 함수 컴포넌트 판별
  - React 소스: `packages/react-reconciler/src/ReactFiber.old.js`
  - `FunctionComponent`: 함수 컴포넌트 타입
  - `HostComponent`: DOM 엘리먼트 타입 (문자열)
- **beginWork**: React의 각 노드 처리 함수
  - 함수 컴포넌트: `updateFunctionComponent` → 컴포넌트 실행 → children 처리
  - 일반 엘리먼트: `updateHostComponent` → props 적용 → children 처리
  - 우리의 `normalizeVNode`는 이 두 가지 케이스를 모두 처리

### 2.4 함수 컴포넌트 실행 시 children 전달

**문제**: 함수 컴포넌트가 props에서 children를 받는데, vNode의 children가 props에 포함되지 않음

**해결**: 함수 컴포넌트 실행 시 vNode.children를 props의 children로 전달

```javascript
if (typeof vNode.type === "function") {
  // props에 children 포함하여 전달
  const props = { ...(vNode.props || {}), children: vNode.children || [] };
  const componentResult = vNode.type(props);

  // 실행 결과를 재귀적으로 정규화
  const normalized = normalizeVNode(componentResult);

  return normalized;
}
```

**예시**:

```javascript
// UnorderedList 컴포넌트
const UnorderedList = ({ children, ...props }) => (
  <ul {...props}>{children}</ul>
);

// vNode: { type: UnorderedList, props: null, children: [<ListItem />] }
// 실행 시: UnorderedList({ children: [<ListItem />] })
// 결과: { type: "ul", props: {}, children: [<ListItem />] }
```

**🔗 React 내부 로직과의 연관성**:

- **Props 전달**: React는 컴포넌트 실행 시 props 객체를 전달
  - React 소스: `packages/react-reconciler/src/ReactFiberBeginWork.js`의 `updateFunctionComponent`
  - `children`는 props의 특수한 속성으로 처리됨
  - `React.createElement`에서 children를 props에 포함시킴
- **Children 처리**: React는 children를 props.children으로 전달
  - 단일 child: `props.children`는 직접 값
  - 여러 children: `props.children`는 배열
  - 우리 구현에서는 항상 배열로 통일하여 처리

### 2.5 정규화된 결과의 children 재귀 처리

**문제**: 함수 컴포넌트 실행 결과의 children 배열에 함수 컴포넌트가 있을 수 있음

**예시**:

```javascript
// UnorderedList 실행 결과
{ type: "ul", props: {}, children: [<ListItem />, <ListItem />] }
// children 배열의 각 요소도 함수 컴포넌트이므로 재귀적으로 정규화 필요
```

**해결**: 정규화된 결과의 children 배열도 재귀적으로 정규화

```javascript
if (typeof vNode.type === "function") {
  const props = { ...(vNode.props || {}), children: vNode.children || [] };
  const componentResult = vNode.type(props);

  // 실행 결과를 재귀적으로 정규화
  const normalized = normalizeVNode(componentResult);

  // 정규화된 결과가 객체이고 children 배열이 있다면,
  // children의 각 요소도 재귀적으로 정규화
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

**왜 필요한가?**

- `normalizeVNode(componentResult)`는 일반 엘리먼트의 children를 재귀 처리하지만,
- 함수 컴포넌트 실행 결과의 children 배열에 함수 컴포넌트가 있을 경우,
- 한 번 더 재귀적으로 정규화해야 모든 컴포넌트가 실행됨

**🔗 React 내부 로직과의 연관성**:

- **컴포넌트 렌더링**: React의 `render` 함수는 컴포넌트를 실행하여 엘리먼트 트리를 생성
  - React 소스: `packages/react-reconciler/src/ReactFiberBeginWork.js`
  - 함수 컴포넌트는 `workLoop`에서 실행되어 엘리먼트를 반환
  - 클래스 컴포넌트는 `instance.render()` 호출
- **Reconciliation 과정**: React는 컴포넌트 실행 결과를 재귀적으로 처리
  - `beginWork`: 컴포넌트를 실행하고 children를 처리
  - `reconcileChildren`: children 배열을 순회하며 각 자식을 재귀적으로 처리
  - 우리의 `normalizeVNode`는 이 과정을 단순화한 버전
- **JSX 변환**: Babel이 JSX를 `React.createElement` 호출로 변환
  - `<Component />` → `React.createElement(Component, null)`
  - `<div>{children}</div>` → `React.createElement("div", null, children)`

### 2.6 최종 구현

```javascript
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
      // 함수 컴포넌트 실행 (props에 children 포함하여 전달)
      const props = { ...(vNode.props || {}), children: vNode.children || [] };
      const componentResult = vNode.type(props);

      // 실행 결과를 재귀적으로 정규화
      const normalized = normalizeVNode(componentResult);

      // 정규화된 결과가 객체이고 children 배열이 있다면,
      // children의 각 요소도 재귀적으로 정규화
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

---

## 3. Husky Pre-commit 훅 설정

### 3.1 문제 상황

**에러 메시지**:

```
.husky/pre-commit: line 1: npx: command not found
husky - pre-commit script failed (code 127)
husky - command not found in PATH=node_modules/.bin:/Library/Developer/CommandLineTools/usr/libexec/git-core:/usr/bin:/bin:/usr/sbin:/sbin
```

**원인**: Git hook 실행 환경의 PATH가 제한적이어서 `npx` 또는 `pnpm` 명령어를 찾을 수 없음

### 3.2 해결 방법

**Husky v9에서는 `husky.sh`를 source할 필요 없음** (deprecated)

**수정 전**:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx lint-staged
```

**수정 후**:

```bash
#!/usr/bin/env sh

# node 경로를 PATH에 추가
export PATH="$PATH:$(dirname -- "$(command -v node)")"
npx lint-staged
```

**또는 pnpm 사용 시**:

```bash
#!/usr/bin/env sh

# node 경로를 PATH에 추가
export PATH="$PATH:$(dirname -- "$(command -v node)")"
pnpm exec lint-staged
```

**핵심 포인트**:

- Git hook 실행 시 PATH가 제한적이므로 명시적으로 node 경로 추가 필요
- `$(command -v node)`: node 실행 파일 경로 찾기
- `$(dirname -- "$(command -v node)")`: node가 있는 디렉토리 경로
- `export PATH="$PATH:..."`: 기존 PATH에 추가

---

## 4. 조건부 렌더링과 Falsy 값 처리

### 4.1 조건부 렌더링의 개념

**React의 조건부 렌더링 패턴**:

```javascript
{condition && <element>}
```

**동작**:

- `condition`이 `true` → `<element>` 렌더링
- `condition`이 `false` → 아무것도 렌더링하지 않음 (children에서 제거)

**테스트 케이스**:

```javascript
<div>
  {true && <span>Shown</span>}
  {false && <span>Hidden</span>}
</div>
// expected: children에 <span>Shown</span>만 포함
```

### 4.2 Falsy 값 처리

**제거해야 하는 값**:

- `null`
- `undefined`
- `false`
- `true` (boolean 값)

**처리 위치**:

- `createVNode`의 `flatten` 함수에서 처리
- `normalizeVNode`에서도 빈 문자열 필터링

**구현**:

```javascript
function flatten(arr) {
  const result = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flatten(item));
    } else if (item != null && item !== false && item !== true) {
      // null, undefined, false, true 제외
      result.push(item);
    }
  }
  return result;
}
```

**`item != null`의 의미**:

- `item !== null && item !== undefined`와 동일
- `null`과 `undefined` 모두 체크하는 간단한 방법

**🔗 React 내부 로직과의 연관성**:

- **조건부 렌더링**: React는 조건부 렌더링에서 falsy 값을 무시
  - React 소스: `packages/react/src/ReactElement.js`
  - `{condition && <element>}` 패턴에서 `condition`이 falsy면 아무것도 렌더링하지 않음
  - `{condition ? <A /> : <B />}` 패턴도 지원
- **Children 정규화**: React는 렌더링 전에 children를 정규화
  - `React.Children.toArray()`: falsy 값 제거 및 배열 평탄화
  - `React.Children.map()`: children를 순회하며 변환 (falsy 값 건너뜀)
  - 우리의 `flatten` 함수는 이 과정을 단순화한 버전

---

## 5. 이벤트 위임 (Event Delegation)

### 5.1 이벤트 위임의 개념

**이벤트 위임이란?**

- 각 요소에 개별적으로 이벤트 리스너를 등록하는 대신, 부모 요소(또는 루트 컨테이너)에 하나의 이벤트 리스너를 등록
- 이벤트 버블링을 활용하여 자식 요소에서 발생한 이벤트를 부모에서 처리
- 동적으로 추가되는 요소에도 이벤트가 자동으로 작동

**장점**:

1. **메모리 효율성**: 많은 요소에 개별 리스너를 등록하지 않아도 됨
2. **동적 요소 지원**: 나중에 추가된 요소에도 이벤트가 자동으로 작동
3. **성능 향상**: 리스너 개수가 줄어들어 메모리 사용량 감소

### 5.2 테스트 케이스 분석

**테스트 코드**:

```javascript
it("이벤트가 위임 방식으로 등록되어야 한다", () => {
  const clickHandler = vi.fn();
  const button = document.createElement("button");
  container.appendChild(button);

  // 1. 이벤트 핸들러 등록
  addEvent(button, "click", clickHandler);
  setupEventListeners(container);
  button.click();
  expect(clickHandler).toHaveBeenCalledTimes(1);

  // 2. stopPropagation을 사용하는 핸들러 추가
  const handleClick = (e) => e.stopPropagation();
  button.addEventListener("click", handleClick);
  button.click();
  expect(clickHandler).toHaveBeenCalledTimes(1); // 위임된 이벤트가 전파되지 않음

  // 3. stopPropagation 핸들러 제거
  button.removeEventListener("click", handleClick);
  button.click();
  expect(clickHandler).toHaveBeenCalledTimes(2); // 다시 위임된 이벤트가 작동
});
```

**테스트의 의도**:

1. **이벤트 위임 작동 확인**
   - `addEvent(button, "click", clickHandler)`: 버튼에 클릭 핸들러 등록
   - `setupEventListeners(container)`: 컨테이너에 이벤트 위임 설정
   - 버튼 클릭 시 핸들러가 호출되는지 확인

2. **stopPropagation과의 상호작용**
   - `button.addEventListener("click", handleClick)`: `stopPropagation`을 사용하는 핸들러 추가
   - 버튼 클릭 시 `stopPropagation`이 이벤트 전파를 막아서 위임된 이벤트가 호출되지 않음
   - 이는 이벤트 위임이 이벤트 버블링에 의존한다는 것을 보여줌

3. **이벤트 핸들러 제거 후 복구**
   - `removeEventListener`로 `stopPropagation` 핸들러 제거
   - 다시 클릭하면 위임된 이벤트가 정상적으로 작동
   - 이는 이벤트 위임이 동적으로 작동한다는 것을 보여줌

### 5.3 구현 요구사항

**필요한 함수들**:

1. **`setupEventListeners(root)`**
   - 루트 컨테이너에 이벤트 위임 설정
   - 각 이벤트 타입별로 하나의 리스너만 등록
   - 이벤트 발생 시 해당 요소의 핸들러를 찾아서 실행

2. **`addEvent(element, eventType, handler)`**
   - 요소에 이벤트 핸들러 등록
   - 핸들러를 저장하는 맵 구조 필요
   - `element`와 `eventType`을 키로 사용

3. **`removeEvent(element, eventType, handler)`**
   - 요소에서 이벤트 핸들러 제거
   - 핸들러 맵에서 해당 항목 삭제

**구현 구조**:

```javascript
// 이벤트 핸들러 저장소
// key: element, value: Map<eventType, Set<handler>>
const eventHandlers = new WeakMap();

// 루트별로 등록된 이벤트 리스너 추적
const rootListeners = new WeakMap();

export function setupEventListeners(root) {
  // 루트에 이벤트 위임 설정
  // 각 이벤트 타입별로 하나의 리스너만 등록
  // 이벤트 발생 시 eventHandlers에서 핸들러 찾아서 실행
}

export function addEvent(element, eventType, handler) {
  // eventHandlers에 핸들러 저장
  // WeakMap을 사용하여 메모리 누수 방지
}

export function removeEvent(element, eventType, handler) {
  // eventHandlers에서 핸들러 제거
}
```

**핵심 구현 포인트**:

1. **WeakMap 사용**: 요소가 DOM에서 제거되면 자동으로 가비지 컬렉션
2. **이벤트 버블링 활용**: 루트에서 이벤트를 받아 타겟까지 올라가며 핸들러 찾기
3. **stopPropagation 처리**: `event.cancelBubble`을 확인하여 전파가 중단되었으면 핸들러 실행 안 함
4. **버블링 단계에서만 처리**: `addEventListener(eventType, handler, false)` - 캡처링은 사용하지 않음

**실제 구현**:

```javascript
// 이벤트 위임 핸들러 (버블링 단계에서만 처리)
const handleEvent = (event) => {
  // stopPropagation이 호출되었는지 확인
  if (event.cancelBubble) {
    return;
  }

  let target = event.target;

  // 이벤트 버블링을 따라 올라가며 핸들러 찾기
  while (target && target !== root) {
    const handlers = eventHandlers.get(target);
    if (handlers) {
      const handlersForType = handlers.get(event.type);
      if (handlersForType && handlersForType.size > 0) {
        // 모든 핸들러 실행
        handlersForType.forEach((handler) => {
          handler(event);
        });
      }
    }
    target = target.parentElement;
  }
};

// 루트에 이벤트 리스너 등록 (버블링 단계)
root.addEventListener(eventType, handleEvent, false);
```

**동작 흐름**:

1. `addEvent(button, "click", handler)`: 핸들러를 WeakMap에 저장
2. `setupEventListeners(container)`: 컨테이너에 이벤트 위임 리스너 등록
3. 버튼 클릭 시:
   - 이벤트가 버블링되어 컨테이너의 `handleEvent` 호출
   - `event.target`부터 시작하여 `container`까지 올라가며 핸들러 찾기
   - 버튼에서 핸들러를 찾으면 실행
4. `stopPropagation` 호출 시:
   - `event.cancelBubble`이 `true`가 됨
   - 위임된 이벤트 핸들러가 실행되지 않음

### 5.4 이벤트 버블링과 stopPropagation

**이벤트 버블링**:

- 이벤트가 발생한 요소에서 시작하여 부모 요소로 전파되는 현상
- 이벤트 위임은 이 버블링을 활용

**stopPropagation의 영향**:

- `e.stopPropagation()`을 호출하면 이벤트 전파가 중단됨
- 위임된 이벤트는 부모 요소에서 처리되므로, 전파가 중단되면 호출되지 않음
- 하지만 요소에 직접 등록된 핸들러는 여전히 작동

**예시**:

```javascript
// 위임된 이벤트 (container에 등록)
container.addEventListener("click", (e) => {
  // button에서 stopPropagation 호출하면 여기 도달하지 않음
});

// 직접 등록된 이벤트 (button에 등록)
button.addEventListener("click", (e) => {
  e.stopPropagation(); // 위임된 이벤트는 호출되지 않음
  // 하지만 이 핸들러는 여전히 실행됨
});
```

**🔗 React 내부 로직과의 연관성**:

- **React의 이벤트 위임**: React는 모든 이벤트를 위임 방식으로 처리
  - React 16 이전: `document`에 모든 이벤트 위임
  - React 17+: 루트 컨테이너에 이벤트 위임
  - React 소스: `packages/react-dom/src/events/ReactDOMEventListener.js`

  **중요**: React는 컴포넌트에 `onClick` 같은 이벤트 핸들러를 props로 전달하지만, 실제로는 각 요소에 개별적으로 이벤트 리스너를 등록하지 않습니다. 대신 루트 컨테이너(또는 document)에 하나의 리스너만 등록하고, 이벤트 발생 시 `event.target`을 확인하여 어떤 컴포넌트의 핸들러를 실행할지 결정합니다.

- **SyntheticEvent**: React는 네이티브 이벤트를 래핑한 SyntheticEvent 사용
  - React 소스: `packages/react-dom/src/events/SyntheticEvent.js`
  - `stopPropagation()` 호출 시 React의 이벤트 시스템에서 전파 중단
  - 네이티브 이벤트는 여전히 버블링되지만, React의 이벤트 핸들러는 호출되지 않음
- **이벤트 풀링**: React는 이벤트 객체를 재사용하여 성능 최적화
  - React 소스: `packages/react-dom/src/events/EventPluginHub.js`
  - 이벤트 핸들러 실행 후 이벤트 객체를 재사용
- **이벤트 등록**: React는 컴포넌트 렌더링 시 이벤트를 등록하지 않음
  - 대신 루트 컨테이너에 모든 이벤트 타입별로 하나의 리스너만 등록
  - 이벤트 발생 시 `target`을 확인하여 해당 컴포넌트의 핸들러를 찾아 실행
  - React 소스: `packages/react-dom/src/events/EventListener.js`

### 5.5 React의 이벤트 위임 구현

**React 17 이전 (document 위임)**:

```javascript
// 모든 이벤트를 document에 위임
document.addEventListener("click", dispatchEvent);
document.addEventListener("change", dispatchEvent);
// ...
```

**React 17+ (루트 컨테이너 위임)**:

```javascript
// 루트 컨테이너에 이벤트 위임
rootContainer.addEventListener("click", dispatchEvent);
rootContainer.addEventListener("change", dispatchEvent);
// ...
```

**이점**:

1. **여러 React 앱 공존**: document 대신 루트에 위임하여 앱 간 간섭 방지
2. **이벤트 캡처링 지원**: 루트에서 캡처링 단계에서도 이벤트 처리 가능
3. **성능 향상**: 이벤트 타겟팅이 더 정확해짐

**우리 구현과의 차이점**:

- React는 모든 이벤트 타입을 자동으로 위임
- 우리는 `setupEventListeners`를 명시적으로 호출해야 함
- React는 SyntheticEvent를 사용하지만, 우리는 네이티브 이벤트 사용

### 5.6 React 이벤트 위임의 실제 동작

**왜 React가 이벤트 위임을 사용하는가?**

1. **성능 최적화**
   - 수천 개의 버튼이 있어도 루트에 하나의 리스너만 등록
   - 메모리 사용량 감소
   - 이벤트 리스너 등록/해제 오버헤드 제거

2. **동적 요소 지원**
   - 나중에 추가된 요소에도 자동으로 이벤트 작동
   - 별도의 이벤트 등록 불필요

3. **일관된 이벤트 처리**
   - 모든 이벤트를 동일한 방식으로 처리
   - SyntheticEvent로 브라우저 간 차이 해결

**React의 실제 동작 예시**:

```javascript
// 사용자가 작성하는 코드
function App() {
  return (
    <div>
      <button onClick={() => console.log("clicked")}>Click</button>
    </div>
  );
}

// React 내부 동작 (단순화)
// 1. 컴포넌트 렌더링 시 각 요소에 이벤트 리스너를 등록하지 않음
// 2. 대신 루트 컨테이너에 하나의 리스너만 등록
rootContainer.addEventListener("click", (nativeEvent) => {
  // 3. 이벤트 발생 시 target을 확인
  const target = nativeEvent.target;

  // 4. target에서 시작하여 위로 올라가며 React 컴포넌트 찾기
  let fiber = getFiberFromDOMNode(target);
  while (fiber) {
    // 5. 해당 컴포넌트의 props에 onClick이 있는지 확인
    if (fiber.memoizedProps?.onClick) {
      // 6. SyntheticEvent 생성 및 핸들러 실행
      const syntheticEvent = createSyntheticEvent(nativeEvent);
      fiber.memoizedProps.onClick(syntheticEvent);
      break;
    }
    fiber = fiber.return; // 부모로 이동
  }
});
```

**핵심 포인트**:

- React는 렌더링 시 이벤트를 등록하지 않음
- 루트에 하나의 리스너만 등록
- 이벤트 발생 시 `target`을 추적하여 핸들러 찾기
- SyntheticEvent로 네이티브 이벤트 래핑

---

## 6. renderElement와 DOM 렌더링

### 6.1 renderElement의 역할

**renderElement란?**

- vNode를 실제 DOM으로 변환하여 컨테이너에 렌더링하는 함수
- 초기 렌더링과 업데이트를 모두 처리
- 이벤트 위임 설정을 자동으로 수행

**렌더링 파이프라인**:

```
vNode → normalizeVNode → createElement → DOM → container
  ↓
이벤트 위임 설정
```

### 6.2 초기 렌더링 vs 업데이트

**초기 렌더링**:

- 컨테이너가 비어있는 경우
- `createElement`로 DOM 생성
- 컨테이너에 추가

**업데이트**:

- 이전 vNode가 있는 경우
- `updateElement`로 기존 DOM 업데이트
- 변경된 부분만 업데이트 (효율적)

**구현**:

```javascript
export function renderElement(vNode, container) {
  // vNode 정규화 (함수 컴포넌트 실행)
  const normalizedVNode = normalizeVNode(vNode);

  // 이전 vNode 가져오기
  const oldVNode = containerVNodes.get(container);

  if (oldVNode) {
    // 업데이트 모드: 기존 DOM을 업데이트
    updateElement(container, normalizedVNode, oldVNode, 0);
  } else {
    // 초기 렌더링: DOM 생성 및 추가
    container.innerHTML = "";
    const domElement = createElement(normalizedVNode);
    // DocumentFragment 처리
    if (domElement.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      while (domElement.firstChild) {
        container.appendChild(domElement.firstChild);
      }
    } else {
      container.appendChild(domElement);
    }
  }

  // 이벤트 위임 설정
  setupEventListeners(container);

  // 현재 vNode 저장 (다음 업데이트를 위해)
  containerVNodes.set(container, normalizedVNode);
}
```

### 6.3 createElement와 이벤트 핸들러

**이벤트 핸들러 등록**:

- props에 `onClick`, `onMouseOver` 등의 이벤트 핸들러가 있으면 자동으로 등록
- `addEvent`를 사용하여 이벤트 위임 시스템에 등록

**구현**:

```javascript
function updateAttributes($el, props) {
  Object.keys(props).forEach((key) => {
    // 이벤트 핸들러 처리 (onClick, onMouseOver 등)
    if (key.startsWith("on") && typeof props[key] === "function") {
      const eventType = key.slice(2).toLowerCase(); // onClick -> click
      addEvent($el, eventType, props[key]);
      return;
    }
    // ... 다른 속성 처리
  });
}
```

### 6.4 updateElement와 Diff 알고리즘

**updateElement의 역할**:

- 이전 vNode와 새 vNode를 비교하여 변경된 부분만 업데이트
- DOM 조작을 최소화하여 성능 최적화

**업데이트 전략**:

1. **노드 추가**: 새 노드만 있는 경우

   ```javascript
   if (newNode && !oldNode) {
     const newElement = createElement(newNode);
     parentElement.appendChild(newElement);
   }
   ```

2. **노드 제거**: 기존 노드만 있는 경우

   ```javascript
   if (!newNode && oldNode) {
     parentElement.removeChild(oldElement);
   }
   ```

3. **노드 교체**: 타입이 다른 경우

   ```javascript
   if (newNode.type !== oldNode.type) {
     const newElement = createElement(newNode);
     parentElement.replaceChild(newElement, oldElement);
   }
   ```

4. **노드 업데이트**: 같은 타입인 경우

   ```javascript
   // 속성 업데이트
   updateAttributes(oldElement, newNode.props, oldNode.props);

   // children 재귀적으로 업데이트
   for (let i = 0; i < maxLength; i++) {
     updateElement(oldElement, newChildren[i], oldChildren[i], i);
   }
   ```

### 6.5 이벤트 핸들러 업데이트

**이벤트 핸들러 변경 처리**:

- 기존 핸들러 제거 후 새 핸들러 추가
- 핸들러가 제거된 경우 `removeEvent` 호출

**구현**:

```javascript
function updateAttributes(target, newProps, oldProps) {
  // 이벤트 핸들러 처리
  if (key.startsWith("on") && typeof newValue === "function") {
    const eventType = key.slice(2).toLowerCase();
    // 기존 핸들러 제거
    if (oldValue && typeof oldValue === "function") {
      removeEvent(target, eventType, oldValue);
    }
    // 새 핸들러 추가
    addEvent(target, eventType, newValue);
  }

  // 이벤트 핸들러 제거 (새 props에 없을 경우)
  if (key.startsWith("on") && oldValue && !newValue) {
    const eventType = key.slice(2).toLowerCase();
    if (typeof oldValue === "function") {
      removeEvent(target, eventType, oldValue);
    }
  }
}
```

### 6.6 동적 요소와 이벤트

**동적으로 추가된 요소**:

- `updateElement`로 새 요소가 추가되면 자동으로 이벤트 핸들러 등록
- 이벤트 위임 덕분에 새 요소에도 이벤트가 자동으로 작동

**테스트 케이스**:

```javascript
// 초기 렌더링
renderElement(initialVNode, container);

// 업데이트 (새 버튼 추가)
renderElement(updatedVNode, container);

// 새 버튼에도 이벤트가 자동으로 작동
const newButton = container.querySelectorAll("button")[1];
newButton.click(); // 이벤트 핸들러 호출됨
```

**🔗 React 내부 로직과의 연관성**:

- **ReactDOM.render**: React의 렌더링 진입점
  - React 소스: `packages/react-dom/src/client/ReactDOMRoot.js`
  - `render` 함수는 컴포넌트를 DOM에 렌더링
  - 우리의 `renderElement`는 이 과정을 단순화한 버전
- **Reconciliation과 Commit**: React는 두 단계로 렌더링
  - **렌더링 단계**: vNode 트리 생성 (우리의 `normalizeVNode`)
  - **커밋 단계**: DOM 업데이트 (우리의 `renderElement`)
  - React 소스: `packages/react-reconciler/src/ReactFiberReconciler.js`
- **Diff 알고리즘**: React는 Fiber 트리를 비교하여 변경사항 파악
  - React 소스: `packages/react-reconciler/src/ReactChildFiber.js`
  - 우리의 `updateElement`는 단순한 diff 알고리즘 구현
- **이벤트 핸들러 등록**: React는 렌더링 시 이벤트 핸들러를 등록하지 않음
  - 대신 이벤트 위임을 사용하여 루트에만 리스너 등록
  - 우리도 동일한 방식으로 구현

### 6.7 주요 구현 포인트

1. **WeakMap으로 vNode 저장**: 컨테이너별로 이전 vNode 저장
2. **정규화 후 렌더링**: 함수 컴포넌트를 먼저 실행
3. **이벤트 위임 자동 설정**: 렌더링 시 자동으로 이벤트 위임 설정
4. **효율적인 업데이트**: 변경된 부분만 업데이트
5. **이벤트 핸들러 동기화**: props 변경 시 이벤트 핸들러도 업데이트

---

## 7. 주요 학습 포인트 정리

### 7.1 vNode 구조

```javascript
{
  type: "div" | Function,  // 엘리먼트 타입 또는 함수 컴포넌트
  props: {},              // 속성 객체
  children: []            // 자식 노드 배열
}
```

### 7.2 함수 컴포넌트 실행 흐름

1. `createVNode`로 vNode 생성 → `{ type: Component, props: {...}, children: [...] }`
2. `normalizeVNode`에서 함수 컴포넌트 감지
3. `vNode.children`를 props의 `children`로 전달하여 컴포넌트 실행
4. 실행 결과를 재귀적으로 정규화
5. 정규화된 결과의 children도 재귀적으로 정규화

### 7.3 재귀 처리의 중요성

- 함수 컴포넌트는 중첩될 수 있음
- 각 레벨에서 재귀적으로 정규화해야 모든 컴포넌트가 실행됨
- children 배열의 각 요소도 재귀적으로 처리 필요

### 7.4 Falsy 값 처리

- 조건부 렌더링에서 falsy 값은 children에서 제거
- `createVNode` 단계에서 필터링하는 것이 효율적
- `normalizeVNode`에서도 빈 문자열 필터링 필요

---

## 8. 디버깅 팁

### 8.1 console.log 활용

- 함수 컴포넌트 실행 전후의 vNode 구조 확인
- children 배열의 내용 확인
- 정규화 과정 추적

### 8.2 테스트 실행

```bash
# 특정 테스트만 실행
npm test -- --run basic.test.jsx -t "테스트명"

# 모든 테스트 실행
npm test
```

### 8.3 일반적인 문제

1. **children가 빈 배열**: 함수 컴포넌트 실행 시 children를 props로 전달하지 않음
2. **함수 컴포넌트가 실행되지 않음**: `typeof vNode.type === "function"` 체크 누락
3. **중첩 컴포넌트가 정규화되지 않음**: 정규화된 결과의 children 재귀 처리 누락

---

## 9. React 내부 로직 매핑

### 9.1 우리 구현 vs React 실제 구현

| 우리 구현          | React 실제 구현              | 위치                                                     |
| ------------------ | ---------------------------- | -------------------------------------------------------- |
| `createVNode`      | `React.createElement`        | `packages/react/src/ReactElement.js`                     |
| `normalizeVNode`   | Reconciliation (렌더링 단계) | `packages/react-reconciler/src/ReactFiberReconciler.js`  |
| `flatten`          | `React.Children.toArray`     | `packages/react/src/ReactChildren.js`                    |
| 함수 컴포넌트 실행 | `updateFunctionComponent`    | `packages/react-reconciler/src/ReactFiberBeginWork.js`   |
| children 정규화    | `reconcileChildren`          | `packages/react-reconciler/src/ReactChildFiber.js`       |
| 이벤트 위임        | `ReactDOMEventListener`      | `packages/react-dom/src/events/ReactDOMEventListener.js` |
| SyntheticEvent     | `SyntheticEvent`             | `packages/react-dom/src/events/SyntheticEvent.js`        |
| `renderElement`    | `ReactDOM.render`            | `packages/react-dom/src/client/ReactDOMRoot.js`          |
| `updateElement`    | Reconciliation (커밋 단계)   | `packages/react-reconciler/src/ReactFiberCommitWork.js`  |

### 9.2 React의 렌더링 파이프라인

```
JSX → React.createElement → React Element (vNode)
  ↓
Reconciliation (렌더링 단계)
  ↓
beginWork (각 노드 처리)
  ├─ updateFunctionComponent (함수 컴포넌트)
  └─ updateHostComponent (DOM 엘리먼트)
  ↓
reconcileChildren (children 처리)
  ↓
재귀적으로 각 child에 대해 beginWork 호출
  ↓
최종 Fiber 트리 생성
```

**우리 구현의 위치**:

- `createVNode`: JSX → React Element 변환
- `normalizeVNode`: Reconciliation의 렌더링 단계 (단순화 버전)
- 실제 React는 Fiber 트리를 생성하지만, 우리는 단순 vNode 트리로 처리

### 9.3 주요 React 소스 코드 위치

1. **React.createElement**
   - 파일: `packages/react/src/ReactElement.js`
   - 함수: `createElement(type, props, ...children)`
   - 역할: JSX를 React Element 객체로 변환

2. **Reconciliation**
   - 파일: `packages/react-reconciler/src/ReactFiberReconciler.js`
   - 함수: `updateContainer`, `performSyncWorkOnRoot`
   - 역할: 컴포넌트 트리를 순회하며 Fiber 노드 생성

3. **beginWork**
   - 파일: `packages/react-reconciler/src/ReactFiberBeginWork.js`
   - 함수: `beginWork`, `updateFunctionComponent`, `updateHostComponent`
   - 역할: 각 노드를 처리하고 children를 재귀적으로 처리

4. **Children 유틸리티**
   - 파일: `packages/react/src/ReactChildren.js`
   - 함수: `mapChildren`, `forEachChildren`, `toArray`
   - 역할: children 배열을 정규화하고 변환

---

## 10. 참고 자료

### 10.1 React 공식 문서

- [React Elements](https://react.dev/reference/react/createElement)
- [Reconciliation](https://react.dev/learn/preserving-and-resetting-state)
- [JSX in Depth](https://react.dev/learn/writing-markup-with-jsx)

### 10.2 React 소스 코드

- React Repository: https://github.com/facebook/react
- 주요 패키지:
  - `packages/react`: React Element 생성
  - `packages/react-reconciler`: Reconciliation 알고리즘
  - `packages/react-dom`: DOM 렌더링

### 10.3 학습 자료

- React의 가상돔 개념
- JSX 변환 과정 (Babel)
- 함수 컴포넌트와 클래스 컴포넌트
- 조건부 렌더링 패턴
- Husky Git hooks 설정

---

## 11. 문서 자동 업데이트

이 문서는 프로젝트 진행 중 질문과 해결 과정을 자동으로 업데이트합니다.

**업데이트 시점**:

- 새로운 질문과 해결 과정이 있을 때
- 중요한 개념이나 구현이 추가될 때
- React 내부 로직과의 연관성이 명확해질 때

**문서 구조**:

- 각 섹션은 독립적으로 읽을 수 있도록 구성
- 코드 예시와 설명을 함께 제공
- React 내부 로직과의 연관성을 명시

---

## 12. 이번 회차 디버깅 & 리팩터링 정리

### 12.1 `createVNode` & `normalizeVNode` 리팩터링 정리

- `createVNode`:
  - 초기에는 `flatten` 헬퍼로 children 배열을 재귀 평탄화 + falsy 값 필터링을 한 번에 처리.
  - 이후에는 `children.flat(Infinity).filter(...)` → `normalizeChildren(children)` 형태로 정리해서,
    - “배열 평탄화”와 “필터링” 역할을 눈에 더 잘 보이게 분리.
- `normalizeVNode`:
  - 옛날 버전: `Array.isArray(vNode) → map(normalizeVNode).join("")` 로 배열을 문자열로 합치는 로직이 있었고,
    - 함수 컴포넌트 결과의 children 에 대해 이중 정규화(두 번 normalize)하는 패턴이 있었음.
  - 현재 버전: 배열을 최상위에서 다루지 않고, children 안에서만 처리 + 함수 컴포넌트는 한 번만 실행/정규화.
  - 이 변화 덕분에:
    - 상세 페이지/관련 상품 컴포넌트 구조가 안정적으로 유지되고,
    - `상품 상세 페이지 워크플로우` E2E 테스트가 통과할 수 있게 됨.

### 12.2 `createElement` & `updateElement` 개선 포인트

- `createElement`:
  - `null/undefined/boolean` → 빈 텍스트 노드, `string/number` → 텍스트 노드로 통일.
  - 배열이면 `DocumentFragment` 를 만들어 각 child 에 대해 `createElement` 를 재귀 호출해서 붙임.
  - 일반 VNode 는 `document.createElement(type)` 후 `updateAttributes` 로 props 적용, children 재귀 렌더.
- `updateElement`:
  - 이전/새 VNode 를 비교해:
    - 없어진 노드는 삭제, 새로 생긴 노드는 추가,
    - 텍스트 노드는 내용이 바뀐 경우만 `textContent` 수정,
    - 타입이 바뀐 노드는 통째로 교체,
    - 타입이 같으면 `updateAttributes` + children 재귀 diff.
  - `updateAttributes` 는 리팩터링을 통해:
    - `oldProps` + `newProps` 의 key 를 `Set` 으로 합쳐 한 번만 순회,
    - 이벤트 / `className` / boolean / 일반 속성을 케이스별로 처리해 가독성과 유지보수성 향상.

### 12.3 `eventManager` 리팩터링과 “두 번 실행” 버그

- 안정된 버전:
  - `WeakMap(element → Map(eventType → Set<handler>>)` 로 핸들러 저장.
  - `rootListeners` 로 루트별로 한 번만 이벤트 위임 리스너 등록.
  - 버블링을 따라 `event.target` → 부모로 올라가며 handlers 실행.
- 문제였던 리팩터링 버전:
  - DOM 요소에 `element.__events[eventType] = [handlers...]` 를 달고,
  - `registeredEventTypes` 로 root 에 리스너를 동적으로 다시 다는 구조.
  - 이 버전에서는:
    - 루트에 동일 타입 리스너가 중복 등록되거나,
    - 한 요소의 `__events[eventType]` 배열에 같은 핸들러가 중복 push 되는 케이스가 발생.
  - 결과:
    - 클릭 한 번에 onClick 핸들러가 두 번 실행 → 장바구니 수량이 1씩이 아니라 2씩 증가.
    - E2E 시나리오에서 “한 번만 추가했는데 수량이 3으로 보이는” 이상한 현상으로 나타남.
- 해결:
  - `eventManager` 를 커밋 기준의 WeakMap + rootListeners 구조로 되돌려,
    - 루트 리스너 중복 등록 방지,
    - Set 사용으로 동일 핸들러 중복 실행 방지.

### 12.4 `renderElement` 의 역할 재정리

- vNode → `normalizeVNode` → `createElement` (초기) 또는 `updateElement` (업데이트) 로 이어지는 엔트리 포인트.
- 최초 렌더:
  - 컨테이너의 이전 VNode 가 없으면 `innerHTML = ""` 로 비우고,
  - `createElement(normalizedVNode)` 로 DOM 을 생성해 컨테이너에 붙임.
  - `setupEventListeners(container)` 로 루트에 이벤트 위임 리스너 설정.
- 업데이트 렌더:
  - `containerVNodes` 에 저장해 둔 이전 VNode 를 꺼내서,
  - `updateElement(container, newVNode, oldVNode)` 로 diff 기반 업데이트 수행.

### 12.5 E2E 테스트 & 장바구니(localStorage) 이슈 정리

- 문제 상황:
  - 여러 E2E 테스트가 순차적으로 돌아가면서,
  - 이전 테스트에서 장바구니에 담아둔 상태가 `shopping_cart` 로컬스토리지에 남아 있음.
  - 다음 테스트에서 `/` 로 진입할 때 `loadCartFromStorage()` 가 이 상태를 `cartStore` 에 복원.
  - `beforeEach` 의 `localStorage.clear()` 는 `page.goto("/")` 이후 실행되므로,
    - 이미 복원된 `cartStore` 상태는 남고,
    - 현재 테스트에서 같은 상품을 한 번 더 추가하면 “기존 수량 + 1” 이 되어 수량이 예상보다 커짐.
- 대응 방향들:
  - `main.js` 에서 테스트 모드에 한해 localStorage 초기화/로드 타이밍을 조정하는 시도.
  - 이후 최종적으로는:
    - `localStorage.clear()` 와 `removeItem("shopping_cart")` 를 패치해서,
    - 호출 시 `CART_ACTIONS.CLEAR_CART` 로 `cartStore` 상태도 함께 비우도록 연결.
  - 목표:
    - 각 테스트는 **항상 빈 장바구니 상태에서 시작**,
    - 단, 같은 테스트 안에서의 새로고침(`reload`) 시에는 로컬스토리지에서 장바구니를 다시 복원하도록 유지.
