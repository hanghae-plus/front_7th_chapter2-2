# 초보자를 위한 과제 실행 가이드

> 이 가이드는 JavaScript 메서드와 React 동작 원리에 익숙하지 않은 1년차 프론트엔드 개발자를 위해 작성되었습니다.

## 📋 목차

1. [시작하기 전에](#시작하기-전에)
2. [학습 로드맵](#학습-로드맵)
3. [Phase별 상세 가이드](#phase별-상세-가이드)
4. [막혔을 때 대처법](#막혔을-때-대처법)
5. [자주 사용하는 JavaScript 메서드](#자주-사용하는-javascript-메서드)
6. [테스트 활용 전략](#테스트-활용-전략)
7. [디버깅 팁](#디버깅-팁)

---

## 시작하기 전에

### 🎯 마음가짐

- **완벽하게 이해하려고 하지 마세요**: 한 번에 다 이해할 수 없습니다. 일단 동작하게 만들고, 반복하면서 이해도를 높여가세요.
- **테스트 주도로 작업하세요**: 테스트가 여러분의 가이드입니다. 테스트를 통과시키는 것에 집중하세요.
- **작은 단위로 나누세요**: 한 번에 하나의 함수만 구현하고 테스트하세요.
- **에러 메시지를 친구처럼**: 에러 메시지를 잘 읽으면 무엇을 고쳐야 하는지 알 수 있습니다.

### 📚 필수 사전 지식

반드시 알아야 하는 개념들입니다. 모르는 게 있다면 먼저 학습하세요.

1. **JavaScript 기본**
   - 변수 (let, const)
   - 함수 (화살표 함수, 일반 함수)
   - 객체와 배열
   - 구조 분해 할당

2. **JavaScript 중급**
   - Array 메서드 (map, filter, forEach, find, some, every)
   - Object 메서드 (Object.keys, Object.entries, Object.is)
   - 클로저 (closure)
   - 재귀 함수

3. **React 기초**
   - JSX란 무엇인가
   - 컴포넌트란 무엇인가
   - Props란 무엇인가
   - State와 Hook의 개념

### 🛠 환경 설정 확인

```bash
# 1. 프로젝트 클론 (이미 했다면 skip)
git clone https://github.com/<YOUR_ID>/front_7th_chapter2-2.git
cd front_7th_chapter2-2

# 2. pnpm 설치 (이미 했다면 skip)
npm install -g pnpm

# 3. 의존성 설치
pnpm install

# 4. 테스트 실행해보기
pnpm run test:basic

# 모든 테스트가 실패하면 정상입니다! (아직 구현 안 했으니까요)
```

---

## 학습 로드맵

### 전체 흐름 이해

```
1. [기본 도구 만들기] → 2. [렌더링 기본 구조] → 3. [실제 DOM 조작]
                    ↓
4. [비동기 처리] → 5. [똑똑한 업데이트] → 6. [상태 관리]
                    ↓
              [기본 과제 완료]
                    ↓
      7. [성능 최적화 & 고급 기능]
                    ↓
              [심화 과제 완료]
```

### 권장 작업 순서 (절대 순서는 아닙니다!)

| 순서 | Phase                    | 예상 소요 시간 | 난이도     |
| ---- | ------------------------ | -------------- | ---------- |
| 1    | Phase 1 (유틸리티)       | 2-3시간        | ⭐⭐       |
| 2    | Phase 2 (컨텍스트)       | 2-4시간        | ⭐⭐⭐     |
| 3    | Phase 3 (DOM)            | 3-5시간        | ⭐⭐⭐     |
| 4    | Phase 4 (스케줄링)       | 2-3시간        | ⭐⭐⭐⭐   |
| 5    | Phase 5 (Reconciliation) | 5-8시간        | ⭐⭐⭐⭐⭐ |
| 6    | Phase 6 (Hooks)          | 4-6시간        | ⭐⭐⭐⭐⭐ |
| 7    | Phase 7 (심화)           | 3-5시간        | ⭐⭐⭐⭐   |

**총 예상 시간: 21-34시간** (개인차가 있습니다)

---

## Phase별 상세 가이드

## Phase 1: VNode와 기초 유틸리티 (난이도: ⭐⭐)

### 목표

JSX를 JavaScript 객체로 변환하고, 값을 비교하는 도구를 만듭니다.

### 작업 순서

#### 1단계: `utils/validators.ts` - isEmptyValue

**무엇을 만드나요?**
값이 "비어있는지" 판단하는 함수입니다.

**왜 필요한가요?**
`null`, `undefined`, `true`, `false` 같은 값들은 화면에 그려지면 안 되니까요.

**구현 예시:**

```typescript
export function isEmptyValue(value: unknown): boolean {
  // null, undefined는 비어있음
  if (value === null || value === undefined) {
    return true;
  }

  // boolean은 화면에 안 그려짐
  if (typeof value === "boolean") {
    return true;
  }

  return false;
}
```

**테스트:**

```bash
pnpm test validators
```

#### 2단계: `utils/equals.ts` - shallowEquals

**무엇을 만드나요?**
두 값이 "얕게" 같은지 비교하는 함수입니다.

**얕은 비교(shallow)란?**

```javascript
// 기본 타입은 값으로 비교
shallowEquals(1, 1); // true
shallowEquals("a", "a"); // true

// 객체는 1단계만 비교
shallowEquals({ a: 1, b: 2 }, { a: 1, b: 2 }); // true

// 중첩된 객체는 참조만 비교
const obj = { x: 1 };
shallowEquals({ a: obj }, { a: obj }); // true (같은 참조)

shallowEquals({ a: { x: 1 } }, { a: { x: 1 } }); // false (다른 참조)
```

**구현 힌트:**

```typescript
export function shallowEquals(a: unknown, b: unknown): boolean {
  // 1. Object.is로 기본 비교
  if (Object.is(a, b)) {
    return true;
  }

  // 2. 타입 체크
  if (typeof a !== "object" || typeof b !== "object") {
    return false;
  }

  if (a === null || b === null) {
    return false;
  }

  // 3. 키 개수 비교
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // 4. 각 키의 값을 Object.is로 비교
  for (const key of keysA) {
    if (!Object.is(a[key], b[key])) {
      return false;
    }
  }

  return true;
}
```

#### 3단계: `utils/equals.ts` - deepEquals

**무엇을 만드나요?**
두 값이 "깊게" 같은지 비교하는 함수입니다.

**깊은 비교(deep)란?**

```javascript
// 중첩된 객체도 값으로 비교
deepEquals({ a: { x: 1 } }, { a: { x: 1 } }); // true

// 배열 안의 객체도 비교
deepEquals([{ id: 1 }, { id: 2 }], [{ id: 1 }, { id: 2 }]); // true
```

**구현 힌트:**

```typescript
export function deepEquals(a: unknown, b: unknown): boolean {
  // 1. Object.is로 기본 비교
  if (Object.is(a, b)) {
    return true;
  }

  // 2. 타입 체크
  if (typeof a !== "object" || typeof b !== "object") {
    return false;
  }

  if (a === null || b === null) {
    return false;
  }

  // 3. 배열 체크
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;

    // 재귀적으로 비교!
    for (let i = 0; i < a.length; i++) {
      if (!deepEquals(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  // 4. 객체 비교
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // 재귀적으로 비교!
  for (const key of keysA) {
    if (!deepEquals(a[key], b[key])) {
      return false;
    }
  }

  return true;
}
```

#### 4단계: `core/elements.ts` - createElement

**무엇을 만드나요?**
JSX를 JavaScript 객체(VNode)로 변환하는 함수입니다.

**JSX가 어떻게 변환되나요?**

```jsx
// JSX 코드
<div className="container">
  <span>Hello</span>
  {count}
</div>;

// 변환됨 ↓

createElement("div", { className: "container" }, createElement("span", null, "Hello"), count);
```

**VNode 객체 구조:**

```typescript
{
  type: 'div',           // 태그 이름 또는 컴포넌트 함수
  props: {
    className: 'container'
  },
  children: [
    {
      type: 'span',
      props: {},
      children: ['Hello']
    },
    count
  ]
}
```

**구현 힌트:**

```typescript
export function createElement(
  type: string | symbol | Function,
  props: Record<string, any> | null,
  ...children: any[]
): VNode {
  return {
    type,
    props: props || {},
    children: children.flat(), // 중첩 배열 평탄화
  };
}
```

**테스트:**

```bash
pnpm test basic.equals.test.tsx
```

---

## Phase 2: 컨텍스트와 루트 초기화 (난이도: ⭐⭐⭐)

### 목표

전역으로 상태를 관리할 컨텍스트를 만들고, 렌더링을 시작하는 함수를 구현합니다.

### 핵심 개념: Context가 뭔가요?

Context는 "전역 상태 저장소"입니다. 다음 정보들을 저장합니다:

1. **root**: 어디에(container) 무엇을(node) 렌더링할지
2. **hooks**: 각 컴포넌트의 state와 effect 정보
3. **effects**: 실행할 effect들의 대기열

### 작업 순서

#### 1단계: `core/context.ts` 구현

**파일 구조:**

```typescript
export const context = {
  root: {
    container: null,
    node: null,
    instance: null,
    reset({ container, node }) {
      this.container = container;
      this.node = node;
      this.instance = null;
    },
  },

  hooks: {
    state: new Map(), // 경로 → 훅 배열
    cursor: new Map(), // 경로 → 현재 커서
    visited: new Set(), // 방문한 경로들
    componentStack: [], // 현재 실행 중인 컴포넌트 스택

    clear() {
      this.state.clear();
      this.cursor.clear();
      this.visited.clear();
      this.componentStack = [];
    },

    get currentPath() {
      const stack = this.componentStack;
      if (stack.length === 0) {
        throw new Error("Hook은 컴포넌트 내부에서만 호출해야 합니다");
      }
      return stack[stack.length - 1];
    },

    get currentCursor() {
      const path = this.currentPath;
      return this.cursor.get(path) || 0;
    },

    get currentHooks() {
      const path = this.currentPath;
      if (!this.state.has(path)) {
        this.state.set(path, []);
      }
      return this.state.get(path);
    },
  },

  effects: {
    queue: [],
  },
};
```

#### 2단계: `core/setup.ts` 구현

**무엇을 하나요?**
렌더링을 시작하는 "진입점" 함수입니다.

**구현 힌트:**

```typescript
export function setup(node: VNode | null, container: HTMLElement): void {
  // 1. 컨테이너 검증
  if (!container) {
    throw new Error("container가 필요합니다");
  }

  // 2. 컨텍스트 초기화
  context.root.reset({ container, node });
  context.hooks.clear();

  // 3. 렌더링 실행 (render 함수는 Phase 4에서 구현)
  // render(node, container);
}
```

---

## Phase 3: DOM 인터페이스 구축 (난이도: ⭐⭐⭐)

### 목표

VNode의 props를 실제 DOM 속성으로 적용하는 함수를 만듭니다.

### 핵심 개념: Props의 종류

Props는 크게 4가지로 나뉩니다:

1. **이벤트**: `onClick`, `onChange` 등
2. **스타일**: `style` 객체
3. **className**: CSS 클래스
4. **일반 속성**: `id`, `src`, `href` 등

### 작업 순서

#### 1단계: `core/dom.ts` - setDomProps

**구현 힌트:**

```typescript
export function setDomProps(dom: HTMLElement, props: Record<string, any>): void {
  for (const [key, value] of Object.entries(props)) {
    // children은 건너뛰기
    if (key === "children") {
      continue;
    }

    // 이벤트 핸들러 처리
    if (key.startsWith("on")) {
      const eventType = key.slice(2).toLowerCase(); // onClick → click
      dom.addEventListener(eventType, value);
      continue;
    }

    // className 처리
    if (key === "className") {
      dom.className = value;
      continue;
    }

    // style 처리
    if (key === "style" && typeof value === "object") {
      for (const [styleKey, styleValue] of Object.entries(value)) {
        dom.style[styleKey] = styleValue;
      }
      continue;
    }

    // 일반 속성
    dom.setAttribute(key, value);
  }
}
```

#### 2단계: `core/dom.ts` - updateDomProps

**무엇을 하나요?**
이전 props와 새 props를 비교해서 변경된 것만 업데이트합니다.

**구현 힌트:**

```typescript
export function updateDomProps(dom: HTMLElement, prevProps: Record<string, any>, nextProps: Record<string, any>): void {
  // 1. 이전 props 제거
  for (const [key, value] of Object.entries(prevProps)) {
    if (key === "children") continue;

    // 새 props에 없으면 제거
    if (!(key in nextProps)) {
      if (key.startsWith("on")) {
        const eventType = key.slice(2).toLowerCase();
        dom.removeEventListener(eventType, value);
      } else if (key === "className") {
        dom.className = "";
      } else if (key === "style") {
        dom.style.cssText = "";
      } else {
        dom.removeAttribute(key);
      }
    }
  }

  // 2. 새 props 적용
  for (const [key, value] of Object.entries(nextProps)) {
    if (key === "children") continue;

    const prevValue = prevProps[key];

    // 값이 같으면 건너뛰기
    if (Object.is(prevValue, value)) {
      continue;
    }

    // 이벤트 핸들러 교체
    if (key.startsWith("on")) {
      const eventType = key.slice(2).toLowerCase();
      if (prevValue) {
        dom.removeEventListener(eventType, prevValue);
      }
      dom.addEventListener(eventType, value);
      continue;
    }

    // className 업데이트
    if (key === "className") {
      dom.className = value;
      continue;
    }

    // style 업데이트
    if (key === "style" && typeof value === "object") {
      // 이전 스타일 제거
      if (prevValue && typeof prevValue === "object") {
        for (const styleKey of Object.keys(prevValue)) {
          if (!(styleKey in value)) {
            dom.style[styleKey] = "";
          }
        }
      }
      // 새 스타일 적용
      for (const [styleKey, styleValue] of Object.entries(value)) {
        dom.style[styleKey] = styleValue;
      }
      continue;
    }

    // 일반 속성
    dom.setAttribute(key, value);
  }
}
```

---

## Phase 4: 렌더 스케줄링 (난이도: ⭐⭐⭐⭐)

### 목표

여러 번의 setState가 호출되어도 렌더링은 한 번만 일어나도록 만듭니다.

### 핵심 개념: 왜 스케줄링이 필요한가?

```javascript
// 이런 상황을 생각해보세요
setState1(newValue1); // 렌더링!
setState2(newValue2); // 또 렌더링!
setState3(newValue3); // 또또 렌더링!

// 이렇게 되면 비효율적이죠?
// 대신 이렇게 하고 싶어요:
setState1(newValue1); // 예약
setState2(newValue2); // 예약
setState3(newValue3); // 예약
// → 한 번에 렌더링!
```

### 작업 순서

#### 1단계: `utils/enqueue.ts` 구현

**마이크로태스크란?**
JavaScript의 이벤트 루프에서 "다음 틱"에 실행되는 작업입니다.

```javascript
console.log("1");
queueMicrotask(() => console.log("3"));
console.log("2");
// 출력: 1, 2, 3
```

**구현:**

```typescript
// 대기 중인 함수들을 저장
const queue: Set<Function> = new Set();
let isScheduled = false;

export function enqueue<T extends (...args: any[]) => any>(func: T): void {
  queue.add(func);

  if (!isScheduled) {
    isScheduled = true;
    queueMicrotask(() => {
      isScheduled = false;
      const funcs = Array.from(queue);
      queue.clear();
      funcs.forEach((f) => f());
    });
  }
}

export function withEnqueue<T extends (...args: any[]) => any>(func: T): T {
  return ((...args: any[]) => {
    enqueue(() => func(...args));
  }) as T;
}
```

#### 2단계: `core/render.ts` 구현

**구현:**

```typescript
import { enqueue, withEnqueue } from "../utils/enqueue";
import { context } from "./context";
import { reconcile } from "./reconciler";

export function render(node: VNode | null, container: HTMLElement): void {
  // 1. 이전 인스턴스 가져오기
  const oldInstance = context.root.instance;

  // 2. Reconciliation 수행
  const newInstance = reconcile(container, node, oldInstance);

  // 3. 새 인스턴스 저장
  context.root.instance = newInstance;

  // 4. Effect 실행
  const effects = context.effects.queue;
  context.effects.queue = [];
  effects.forEach((effect) => effect());
}

// 렌더링 예약 함수
export const enqueueRender = withEnqueue(() => {
  const { container, node } = context.root;
  if (container && node) {
    render(node, container);
  }
});
```

---

## Phase 5: Reconciliation (난이도: ⭐⭐⭐⭐⭐)

### 목표

가장 어려운 부분입니다! 이전 VNode와 새 VNode를 비교해서 최소한의 DOM 변경만 수행합니다.

### 핵심 개념: Reconciliation이 뭔가요?

**예시:**

```javascript
// 이전 상태
<ul>
  <li key="1">A</li>
  <li key="2">B</li>
  <li key="3">C</li>
</ul>

// 새 상태
<ul>
  <li key="2">B</li>
  <li key="1">A</li>
  <li key="4">D</li>
</ul>

// Reconciliation이 하는 일:
// 1. key="2"는 그대로 (재사용)
// 2. key="1"은 이동
// 3. key="3"은 제거
// 4. key="4"는 추가
```

### 작업 순서

#### 1단계: Instance 타입 이해하기

**Instance란?**
VNode와 실제 DOM을 연결하는 객체입니다.

```typescript
type Instance = {
  vnode: VNode; // 가상 DOM
  dom: HTMLElement | Text | null; // 실제 DOM
  children: Instance[]; // 자식 인스턴스들
  path?: string; // 컴포넌트 경로 (컴포넌트인 경우)
};
```

#### 2단계: `core/reconciler.ts` - mount 함수

**무엇을 하나요?**
새로운 VNode를 DOM으로 만듭니다.

**구현 힌트:**

```typescript
function mount(container: HTMLElement, vnode: VNode): Instance {
  // 1. 텍스트 노드 처리
  if (typeof vnode.type === "string" && vnode.type === "TEXT") {
    const textNode = document.createTextNode(vnode.props.nodeValue);
    container.appendChild(textNode);
    return {
      vnode,
      dom: textNode,
      children: [],
    };
  }

  // 2. 컴포넌트 처리 (함수인 경우)
  if (typeof vnode.type === "function") {
    return mountComponent(container, vnode);
  }

  // 3. DOM 요소 생성
  const dom = document.createElement(vnode.type as string);

  // 4. Props 적용
  setDomProps(dom, vnode.props);

  // 5. 자식들 마운트
  const childInstances = [];
  for (const child of vnode.children) {
    const childInstance = mount(dom, child);
    childInstances.push(childInstance);
  }

  // 6. DOM에 추가
  container.appendChild(dom);

  return {
    vnode,
    dom,
    children: childInstances,
  };
}
```

#### 3단계: `core/reconciler.ts` - reconcile 함수

**구현 골격:**

```typescript
export function reconcile(
  container: HTMLElement,
  newNode: VNode | null,
  oldInstance: Instance | null,
): Instance | null {
  // Case 1: 새 노드가 없음 → 제거
  if (newNode === null) {
    if (oldInstance) {
      unmount(container, oldInstance);
    }
    return null;
  }

  // Case 2: 이전 인스턴스가 없음 → 새로 생성
  if (oldInstance === null) {
    return mount(container, newNode);
  }

  // Case 3: 타입이 다름 → 교체
  if (newNode.type !== oldInstance.vnode.type) {
    unmount(container, oldInstance);
    return mount(container, newNode);
  }

  // Case 4: 타입이 같음 → 업데이트
  return update(container, newNode, oldInstance);
}
```

---

## Phase 6: 기본 Hook 시스템 (난이도: ⭐⭐⭐⭐⭐)

### 목표

useState와 useEffect를 구현합니다.

### 핵심 개념: Hook이 어떻게 동작하나?

**Hook의 규칙:**

1. 항상 같은 순서로 호출되어야 함
2. 컴포넌트 내부에서만 호출되어야 함

**왜 순서가 중요한가?**

```javascript
function Counter() {
  const [count, setCount] = useState(0); // 커서 0
  const [name, setName] = useState(""); // 커서 1

  // 만약 조건문 안에서 Hook을 호출하면?
  if (count > 5) {
    const [extra, setExtra] = useState(0); // 커서 2 또는 없음?!
  }

  const [age, setAge] = useState(20); // 커서 2? 3? 모호함!
}
```

### 작업 순서

#### 1단계: `core/hooks.ts` - useState

**구현:**

```typescript
export function useState<T>(initialValue: T | (() => T)): [T, (newValue: T | ((prev: T) => T)) => void] {
  const { hooks } = context;

  // 1. 현재 위치 정보
  const path = hooks.currentPath;
  const cursor = hooks.currentCursor;
  const currentHooks = hooks.currentHooks;

  // 2. 첫 렌더링: 초기값 설정
  if (currentHooks[cursor] === undefined) {
    const value = typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;

    currentHooks[cursor] = { value };
  }

  const hook = currentHooks[cursor];

  // 3. setState 함수
  const setState = (newValue: T | ((prev: T) => T)) => {
    const nextValue = typeof newValue === "function" ? (newValue as (prev: T) => T)(hook.value) : newValue;

    // 값이 변경되었을 때만 리렌더링
    if (!Object.is(hook.value, nextValue)) {
      hook.value = nextValue;
      enqueueRender();
    }
  };

  // 4. 커서 증가
  hooks.cursor.set(path, cursor + 1);

  return [hook.value, setState];
}
```

#### 2단계: `core/hooks.ts` - useEffect

**구현:**

```typescript
export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void {
  const { hooks, effects } = context;

  // 1. 현재 위치 정보
  const path = hooks.currentPath;
  const cursor = hooks.currentCursor;
  const currentHooks = hooks.currentHooks;

  // 2. 이전 effect 가져오기
  const prevHook = currentHooks[cursor];

  // 3. 의존성 비교
  const hasChanged = !prevHook || !deps || !prevHook.deps || !shallowEquals(prevHook.deps, deps);

  // 4. 변경되었으면 effect 예약
  if (hasChanged) {
    // 이전 cleanup 실행
    if (prevHook?.cleanup) {
      effects.queue.push(prevHook.cleanup);
    }

    // 새 effect 예약
    effects.queue.push(() => {
      const cleanup = effect();
      if (typeof cleanup === "function") {
        currentHooks[cursor].cleanup = cleanup;
      }
    });
  }

  // 5. Hook 정보 저장
  currentHooks[cursor] = {
    deps,
    cleanup: prevHook?.cleanup,
  };

  // 6. 커서 증가
  hooks.cursor.set(path, cursor + 1);
}
```

---

## Phase 7: 심화 과제 (난이도: ⭐⭐⭐⭐)

Phase 7은 기본 Hook을 잘 이해했다면 비교적 쉽습니다!

### useRef

```typescript
export function useRef<T>(initialValue: T): { current: T } {
  // useState를 활용하되, 항상 같은 객체 반환
  const [ref] = useState(() => ({ current: initialValue }));
  return ref;
}
```

### useMemo

```typescript
export function useMemo<T>(factory: () => T, deps: unknown[]): T {
  // useState로 이전 값과 deps 저장
  const [state, setState] = useState(() => ({
    value: factory(),
    deps,
  }));

  // deps가 변경되었으면 재계산
  if (!shallowEquals(state.deps, deps)) {
    const newValue = factory();
    setState({ value: newValue, deps });
    return newValue;
  }

  return state.value;
}
```

### useCallback

```typescript
export function useCallback<T extends Function>(callback: T, deps: unknown[]): T {
  // useMemo로 함수를 메모이제이션
  return useMemo(() => callback, deps);
}
```

### memo (HOC)

```typescript
export function memo<P extends Record<string, any>>(Component: ComponentType<P>): ComponentType<P> {
  let prevProps: P | null = null;
  let prevResult: VNode | null = null;

  return function MemoizedComponent(props: P): VNode {
    // Props가 같으면 이전 결과 재사용
    if (prevProps && shallowEquals(prevProps, props)) {
      return prevResult!;
    }

    prevProps = props;
    prevResult = Component(props);
    return prevResult;
  };
}
```

---

## 막혔을 때 대처법

### 1. 에러 메시지 읽기

**나쁜 예:**

```
❌ "에러 떴어... 어떡하지?"
```

**좋은 예:**

```
✅ "TypeError: Cannot read property 'type' of undefined"
   → vnode가 undefined네? 어디서 null 체크를 안 했나?
```

### 2. console.log 적극 활용

```typescript
function reconcile(container, newNode, oldInstance) {
  console.log("reconcile 시작", { newNode, oldInstance });

  // ...코드...

  console.log("reconcile 끝", { result });
  return result;
}
```

### 3. 테스트 하나씩 통과시키기

```bash
# 전체 테스트 (실패 많음)
pnpm test

# 특정 테스트만
pnpm test basic.equals.test.tsx

# 특정 테스트 케이스만
pnpm test -- -t "shallowEquals"
```

### 4. 작은 단위로 테스트

```typescript
// 복잡한 함수를 작성하기 전에
// 간단한 케이스부터 테스트

function shallowEquals(a, b) {
  // 1단계: 기본 타입만 처리
  if (Object.is(a, b)) return true;
  return false;
}

// 테스트 → 통과
// 그다음 2단계: 객체 처리 추가
// ...
```

### 5. 도움 요청하기

**나쁜 질문:**

```
"reconcile 함수가 안 돼요. 도와주세요."
```

**좋은 질문:**

```
"reconcile 함수에서 자식 노드를 비교할 때,
key가 있는 경우와 없는 경우를 어떻게 구분해야 하나요?
현재 제 코드는 이렇습니다: [코드]
이런 에러가 발생합니다: [에러]"
```

---

## 자주 사용하는 JavaScript 메서드

### 배열 메서드

```javascript
// map: 변환
[1, 2, 3]
  .map((x) => x * 2) // [2, 4, 6]

  [
    // filter: 필터링
    (1, 2, 3)
  ].filter((x) => x > 1) // [2, 3]

  [
    // find: 찾기
    (1, 2, 3)
  ].find((x) => x === 2) // 2

  [
    // some: 하나라도 조건 만족?
    (1, 2, 3)
  ].some((x) => x > 2) // true

  [
    // every: 모두 조건 만족?
    (1, 2, 3)
  ].every((x) => x > 0) // true

  [
    // forEach: 순회
    (1, 2, 3)
  ].forEach((x) => console.log(x))

  [
    // reduce: 축약
    (1, 2, 3)
  ].reduce((sum, x) => sum + x, 0) // 6

  [
    // flat: 평탄화
    (1, [2, [3]])
  ].flat(2); // [1, 2, 3]
```

### 객체 메서드

```javascript
const obj = { a: 1, b: 2 };

// Object.keys: 키 배열
Object.keys(obj); // ['a', 'b']

// Object.values: 값 배열
Object.values(obj); // [1, 2]

// Object.entries: [키, 값] 배열
Object.entries(obj); // [['a', 1], ['b', 2]]

// Object.is: 엄격한 비교
Object.is(NaN, NaN); // true (===는 false)
Object.is(+0, -0); // false (===는 true)

// Object.assign: 복사
Object.assign({}, obj, { c: 3 }); // { a: 1, b: 2, c: 3 }
```

### Map 메서드

```javascript
const map = new Map();

// set: 저장
map.set("key", "value");

// get: 가져오기
map.get("key"); // 'value'

// has: 존재 확인
map.has("key"); // true

// delete: 삭제
map.delete("key");

// clear: 전체 삭제
map.clear();

// size: 크기
map.size; // 0
```

### Set 메서드

```javascript
const set = new Set();

// add: 추가
set.add(1);
set.add(2);

// has: 존재 확인
set.has(1); // true

// delete: 삭제
set.delete(1);

// clear: 전체 삭제
set.clear();

// size: 크기
set.size; // 0
```

---

## 테스트 활용 전략

### 1. TDD (Test-Driven Development) 방식

```
1. 테스트 실행 → 실패 확인
2. 최소한의 코드 작성
3. 테스트 실행 → 성공 확인
4. 리팩토링
5. 반복
```

### 2. 테스트 읽는 법

```typescript
describe("shallowEquals", () => {
  it("should return true for same primitives", () => {
    expect(shallowEquals(1, 1)).toBe(true);
    expect(shallowEquals("a", "a")).toBe(true);
  });
});
```

**해석:**

- `describe`: 무엇을 테스트하는지 (shallowEquals 함수)
- `it`: 어떤 동작을 확인하는지 (같은 원시값에 대해 true 반환)
- `expect(...).toBe(...)`: 예상 결과

### 3. 테스트 우선순위

1. **가장 쉬운 것부터**: `isEmptyValue`, `shallowEquals`
2. **중간 난이도**: `createElement`, `setDomProps`
3. **어려운 것**: `reconcile`, `useState`

---

## 디버깅 팁

### 1. Chrome DevTools 활용

```typescript
function reconcile(container, newNode, oldInstance) {
  debugger; // 여기서 멈춤!

  // F10: 다음 줄
  // F11: 함수 안으로
  // F8: 계속 실행
}
```

### 2. 의미 있는 로그 남기기

```typescript
// 나쁜 예
console.log(vnode);

// 좋은 예
console.log("🔍 reconcile 시작:", {
  nodeType: newNode?.type,
  hasOldInstance: !!oldInstance,
  children: newNode?.children?.length,
});
```

### 3. 단계별 검증

```typescript
function complexFunction() {
  const step1 = doStep1();
  console.assert(step1, "Step 1 실패");

  const step2 = doStep2(step1);
  console.assert(step2, "Step 2 실패");

  return step2;
}
```

---

## 마치며

### 🎓 학습 체크리스트

과제를 마치면서 다음을 이해했는지 확인해보세요:

- [ ] Virtual DOM이 무엇이고 왜 필요한지 설명할 수 있다
- [ ] Reconciliation 알고리즘의 원리를 설명할 수 있다
- [ ] Hook의 규칙이 왜 필요한지 이해했다
- [ ] useState와 useEffect의 동작 방식을 설명할 수 있다
- [ ] 얕은 비교와 깊은 비교의 차이를 설명할 수 있다
- [ ] React의 렌더링 최적화 기법을 이해했다

### 💡 더 공부하면 좋은 것들

- React Fiber 아키텍처
- Concurrent Mode
- Suspense
- Server Components

### 🚀 다음 단계

이 과제를 완료했다면 다음을 시도해보세요:

1. **실제 React 코드 읽기**: React 공식 저장소에서 코드를 읽어보세요
2. **성능 프로파일링**: Chrome DevTools로 렌더링 성능 분석
3. **커스텀 Hook 만들기**: useLocalStorage, useDebounce 등
4. **상태 관리 라이브러리 만들기**: Redux, Zustand 같은 것들의 간단한 버전

---

**화이팅! 🎉**

막히는 부분이 있으면 언제든 질문하세요!
