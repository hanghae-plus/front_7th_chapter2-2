# 🎯 Mini-React 구현 체크리스트

> **사용법:** 위에서부터 순서대로 체크하면서 진행하세요. 각 항목을 완료하면 체크박스에 ✅를 표시하세요.

## 📌 시작하기 전 준비

### 환경 설정

- [x] **프로젝트 클론 확인**

  ```bash
  cd /Users/kimdohyeon-business/hanghae/front_7th_chapter2-2
  pwd  # 현재 위치 확인
  ```

- [x] **의존성 설치**

  ```bash
  pnpm install
  ```

- [x] **테스트 실행해보기 (현재 상태 확인)**

  ```bash
  pnpm run test:basic
  # 모든 테스트가 실패하면 정상! (아직 구현 안 했으니까)
  ```

- [x] **브랜치 생성**
  ```bash
  git checkout -b feat/implement-mini-react
  ```

---

## 🔧 Phase 1: VNode와 기초 유틸리티 (예상 시간: 2-3시간)

> **생각의 흐름:** JSX를 객체로 변환하고, 값을 비교하는 기본 도구부터 만들자.

### Step 1.1: isEmptyValue 구현

- [x] **파일 열기:** `packages/react/src/utils/validators.ts`

- [x] **생각하기:** "null, undefined, boolean은 화면에 렌더링되면 안 되니까 '비어있다'고 판단해야 해"

- [x] **코드 작성:**

  ```typescript
  export function isEmptyValue(value: unknown): boolean {
    // null과 undefined는 비어있음
    if (value === null || value === undefined) {
      return true;
    }

    // boolean은 React에서 렌더링 안 됨
    if (typeof value === "boolean") {
      return true;
    }

    return false;
  }
  ```

- [ ] **저장 후 테스트:**

  ```bash
  pnpm test validators
  # isEmptyValue 관련 테스트가 통과하는지 확인
  ```

- [ ] **커밋:**
  ```bash
  git add packages/react/src/utils/validators.ts
  git commit -m "feat: implement isEmptyValue validator"
  ```

---

### Step 1.2: shallowEquals 구현

- [x] **파일 열기:** `packages/react/src/utils/equals.ts`

- [x] **생각하기:** "두 값이 '얕게' 같은지 비교. 객체는 1단계만 비교하면 돼"

- [x] **코드 작성:**

  ```typescript
  export function shallowEquals(a: unknown, b: unknown): boolean {
    // 1. 기본 비교 (Object.is는 NaN === NaN도 true로 처리)
    if (Object.is(a, b)) {
      return true;
    }

    // 2. 타입 체크
    if (typeof a !== "object" || typeof b !== "object") {
      return false;
    }

    // 3. null 체크
    if (a === null || b === null) {
      return false;
    }

    // 4. 배열/객체 얕은 비교
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    // 키 개수가 다르면 다름
    if (keysA.length !== keysB.length) {
      return false;
    }

    // 각 키의 값을 Object.is로 비교 (1단계만!)
    for (const key of keysA) {
      if (!Object.is((a as any)[key], (b as any)[key])) {
        return false;
      }
    }

    return true;
  }

  // deepEquals는 나중에 구현 (일단 placeholder)
  export function deepEquals(a: unknown, b: unknown): boolean {
    return shallowEquals(a, b); // 임시
  }
  ```

- [ ] **저장 후 테스트:**

  ```bash
  pnpm test basic.equals.test.tsx
  # shallowEquals 테스트 통과 확인
  ```

- [ ] **커밋:**
  ```bash
  git add packages/react/src/utils/equals.ts
  git commit -m "feat: implement shallowEquals"
  ```

---

### Step 1.3: deepEquals 구현

- [x] **파일 열기:** `packages/react/src/utils/equals.ts` (이미 열려있음)

- [x] **생각하기:** "중첩된 객체도 재귀적으로 비교해야 해. shallowEquals의 재귀 버전이네"

- [x] **코드 수정 (deepEquals 부분):**

  ```typescript
  export function deepEquals(a: unknown, b: unknown): boolean {
    // 1. 기본 비교
    if (Object.is(a, b)) {
      return true;
    }

    // 2. 타입 체크
    if (typeof a !== "object" || typeof b !== "object") {
      return false;
    }

    // 3. null 체크
    if (a === null || b === null) {
      return false;
    }

    // 4. 배열 처리
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }

      // 배열의 각 요소를 재귀적으로 비교!
      for (let i = 0; i < a.length; i++) {
        if (!deepEquals(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }

    // 5. 배열이 아닌 경우 (하나만 배열이면 false)
    if (Array.isArray(a) || Array.isArray(b)) {
      return false;
    }

    // 6. 객체 깊은 비교
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) {
      return false;
    }

    // 각 키의 값을 재귀적으로 비교!
    for (const key of keysA) {
      if (!deepEquals((a as any)[key], (b as any)[key])) {
        return false;
      }
    }

    return true;
  }
  ```

- [ ] **저장 후 테스트:**

  ```bash
  pnpm test basic.equals.test.tsx
  # 모든 equals 테스트 통과 확인
  ```

- [ ] **커밋:**
  ```bash
  git add packages/react/src/utils/equals.ts
  git commit -m "feat: implement deepEquals with recursion"
  ```

---

### Step 1.4: createElement 구현

- [x] **파일 열기:** `packages/react/src/core/elements.ts`

- [x] **생각하기:** "JSX가 createElement로 변환돼. type, props, children을 받아서 VNode 객체로 만들어야 해"

- [x] **코드 작성:**

  ```typescript
  import { isEmptyValue } from "../utils/validators";
  import type { VNode } from "./types";

  export const Fragment = Symbol("Fragment");

  export function createElement(
    type: string | symbol | Function,
    props: Record<string, any> | null,
    ...children: any[]
  ): VNode {
    // 1. props 처리 (null이면 빈 객체)
    const vNodeProps = props || {};

    // 2. children 평탄화 및 정제
    const flatChildren = children
      .flat(Infinity) // 중첩 배열 평탄화
      .filter((child) => !isEmptyValue(child)) // 빈 값 제거
      .map((child) => {
        // 문자열이나 숫자는 텍스트 노드로 변환
        if (typeof child === "string" || typeof child === "number") {
          return createTextNode(String(child));
        }
        return child;
      });

    return {
      type,
      props: vNodeProps,
      children: flatChildren,
    };
  }

  // 텍스트 노드 생성 헬퍼
  function createTextNode(text: string): VNode {
    return {
      type: "TEXT_NODE",
      props: { nodeValue: text },
      children: [],
    };
  }
  ```

- [ ] **저장 후 확인:**

  ```bash
  # 아직 완전한 테스트는 안 되지만, 빌드 에러가 없는지 확인
  pnpm run test:basic
  ```

- [ ] **커밋:**
  ```bash
  git add packages/react/src/core/elements.ts
  git commit -m "feat: implement createElement and Fragment"
  ```

---

### Step 1.5: Phase 1 완료 체크

- [x] **전체 테스트 실행:**

  ```bash
  pnpm test basic.equals.test.tsx
  # equals 관련 모든 테스트 통과 확인
  ```

- [ ] **중간 커밋:**
  ```bash
  git add .
  git commit -m "chore: complete Phase 1 - VNode and utilities"
  ```

---

## 🏗️ Phase 2: 컨텍스트와 루트 초기화 (예상 시간: 2-4시간)

> **생각의 흐름:** 전역 상태를 관리할 컨텍스트를 만들고, 렌더링 시작점을 준비하자.

### Step 2.1: types.ts 정의

<!-- 이미 설정되어 있음 -->

- [x] **파일 열기:** `packages/react/src/core/types.ts`

- [x] **생각하기:** "VNode, Instance, Context 타입을 명확히 정의해야 나중에 헷갈리지 않아"

- [x] **코드 작성:**

  ```typescript
  export type VNode = {
    type: string | symbol | Function;
    props: Record<string, any>;
    children: VNode[];
  };

  export type Instance = {
    vnode: VNode;
    dom: HTMLElement | Text | null;
    children: Instance[];
    path?: string; // 컴포넌트 경로
    cleanup?: () => void; // effect cleanup
  };

  export type HookState = {
    value?: any;
    deps?: unknown[];
    cleanup?: () => void;
  };

  export type Context = {
    root: {
      container: HTMLElement | null;
      node: VNode | null;
      instance: Instance | null;
      reset: (params: { container: HTMLElement; node: VNode | null }) => void;
    };
    hooks: {
      state: Map<string, HookState[]>;
      cursor: Map<string, number>;
      visited: Set<string>;
      componentStack: string[];
      clear: () => void;
      readonly currentPath: string;
      readonly currentCursor: number;
      readonly currentHooks: HookState[];
    };
    effects: {
      queue: Array<() => void>;
    };
  };
  ```

- [ ] **저장 후 확인:**

  ```bash
  # 타입 에러 없는지 확인
  cd packages/react
  pnpm run type-check
  ```

- [ ] **커밋:**
  ```bash
  git add packages/react/src/core/types.ts
  git commit -m "feat: define core types for VNode, Instance, Context"
  ```

---

### Step 2.2: context.ts 구현

- [x] **파일 열기:** `packages/react/src/core/context.ts`

- [x] **생각하기:** "전역 컨텍스트를 만들어서 모든 Hook과 렌더링 상태를 여기서 관리"

- [x] **코드 작성:**

  ```typescript
  import type { Context } from "./types";

  export const context: Context = {
    // 렌더링 루트 관리
    root: {
      container: null,
      node: null,
      instance: null,

      reset({ container, node }) {
        this.container = container;
        this.node = node;
        this.instance = null; // 새로 렌더링할 때 초기화
      },
    },

    // Hook 상태 관리
    hooks: {
      state: new Map(), // 경로별 Hook 상태 저장소
      cursor: new Map(), // 경로별 현재 Hook 커서
      visited: new Set(), // 이번 렌더에서 방문한 컴포넌트
      componentStack: [], // 현재 실행 중인 컴포넌트 스택

      // 모든 Hook 상태 초기화
      clear() {
        this.state.clear();
        this.cursor.clear();
        this.visited.clear();
        this.componentStack = [];
      },

      // 현재 컴포넌트 경로 (getter)
      get currentPath(): string {
        if (this.componentStack.length === 0) {
          throw new Error(
            "Hooks can only be called inside a component. " +
              "Make sure you are calling hooks at the top level of your component.",
          );
        }
        return this.componentStack[this.componentStack.length - 1];
      },

      // 현재 Hook 커서 (getter)
      get currentCursor(): number {
        const path = this.currentPath;
        return this.cursor.get(path) || 0;
      },

      // 현재 컴포넌트의 Hook 배열 (getter)
      get currentHooks(): any[] {
        const path = this.currentPath;
        if (!this.state.has(path)) {
          this.state.set(path, []);
        }
        return this.state.get(path)!;
      },
    },

    // Effect 큐 관리
    effects: {
      queue: [],
    },
  };
  ```

- [x] **저장 후 확인:**

  ```bash
  pnpm run type-check
  ```

- [x] **커밋:**
  ```bash
  git add packages/react/src/core/context.ts
  git commit -m "feat: implement global context for state management"
  ```

---

### Step 2.3: setup.ts 구현

- [x] **파일 열기:** `packages/react/src/core/setup.ts`

- [x] **생각하기:** "렌더링의 진입점. 컨테이너 검증하고 컨텍스트 초기화한 다음 render 호출"

- [x] **코드 작성:**

  ```typescript
  import { context } from "./context";
  import { render } from "./render";
  import type { VNode } from "./types";

  /**
   * 루트 렌더링 시작점
   * createRoot().render()에서 호출됨
   */
  export function setup(node: VNode | null, container: HTMLElement): void {
    // 1. 컨테이너 검증
    if (!container) {
      throw new Error("Container must be provided for rendering");
    }

    if (!(container instanceof HTMLElement)) {
      throw new Error("Container must be an HTMLElement");
    }

    // 2. 컨텍스트 초기화
    context.root.reset({ container, node });

    // 3. 렌더링 실행 (render는 Phase 4에서 구현)
    render(node, container);
  }
  ```

- [ ] **저장 (에러 나는 게 정상 - render가 아직 없음)**

- [ ] **커밋:**
  ```bash
  git add packages/react/src/core/setup.ts
  git commit -m "feat: implement setup for root initialization"
  ```

---

### Step 2.4: client/index.ts 구현

- [x] **파일 열기:** `packages/react/src/client/index.ts`

- [x] **생각하기:** "React의 createRoot API처럼 만들어야 해"

- [x] **코드 작성:**

  ```typescript
  import { setup } from "../core/setup";
  import type { VNode } from "../core/types";

  type Root = {
    render: (node: VNode | null) => void;
  };

  /**
   * React 18의 createRoot API와 동일한 인터페이스
   *
   * 사용법:
   * const root = createRoot(document.getElementById('root'));
   * root.render(<App />);
   */
  export function createRoot(container: HTMLElement): Root {
    return {
      render(node: VNode | null) {
        setup(node, container);
      },
    };
  }
  ```

- [x] **저장 후 확인:**

  ```bash
  pnpm run type-check
  ```

- [x] **커밋:**
  ```bash
  git add packages/react/src/client/index.ts
  git commit -m "feat: implement createRoot API"
  ```

---

### Step 2.5: Phase 2 완료 체크

- [x] **export 확인:** `packages/react/src/index.ts` 파일 열기

- [x] **필요한 export 추가:**

  ```typescript
  export { createRoot } from "./client";
  export { createElement, Fragment } from "./core/elements";
  export type { VNode } from "./core/types";
  ```

- [x] **빌드 확인:**

  ```bash
  cd packages/react
  pnpm build
  ```

- [x] **커밋:**
  ```bash
  git add .
  git commit -m "chore: complete Phase 2 - Context and root initialization"
  ```

---

## 🎨 Phase 3: DOM 인터페이스 구축 (예상 시간: 3-5시간)

> **생각의 흐름:** VNode의 props를 실제 DOM에 적용하는 함수들을 만들자.

### Step 3.1: dom.ts - setDomProps 구현

- [x] **파일 열기:** `packages/react/src/core/dom.ts`

- [x] **생각하기:** "props를 DOM에 적용. 이벤트, style, className, 일반 속성 각각 다르게 처리"

- [x] **코드 작성:**

  ```typescript
  /**
   * DOM 요소에 props 적용
   */
  export function setDomProps(dom: HTMLElement, props: Record<string, any>): void {
    for (const [key, value] of Object.entries(props)) {
      // children은 별도 처리
      if (key === "children") {
        continue;
      }

      // 1. 이벤트 핸들러 (onClick, onChange 등)
      if (key.startsWith("on")) {
        const eventType = key.slice(2).toLowerCase(); // onClick → click
        dom.addEventListener(eventType, value);
        continue;
      }

      // 2. className
      if (key === "className") {
        dom.className = value || "";
        continue;
      }

      // 3. style 객체
      if (key === "style" && typeof value === "object" && value !== null) {
        for (const [styleKey, styleValue] of Object.entries(value)) {
          (dom.style as any)[styleKey] = styleValue;
        }
        continue;
      }

      // 4. 일반 속성
      if (value != null) {
        dom.setAttribute(key, String(value));
      }
    }
  }
  ```

- [ ] **저장**

- [ ] **커밋:**
  ```bash
  git add packages/react/src/core/dom.ts
  git commit -m "feat: implement setDomProps for initial DOM setup"
  ```

---

### Step 3.2: dom.ts - updateDomProps 구현

- [x] **파일:** `packages/react/src/core/dom.ts`

- [x] **생각하기:** "이전 props와 새 props 비교해서 변경된 것만 업데이트"

- [ ] **코드 추가:**

  ```typescript
  /**
   * DOM 요소의 props 업데이트
   */
  export function updateDomProps(
    dom: HTMLElement,
    prevProps: Record<string, any>,
    nextProps: Record<string, any>,
  ): void {
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

      // 값이 같으면 스킵
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
        dom.className = value || "";
        continue;
      }

      // style 업데이트
      if (key === "style" && typeof value === "object" && value !== null) {
        // 이전 스타일 제거
        if (prevValue && typeof prevValue === "object") {
          for (const styleKey of Object.keys(prevValue)) {
            if (!(styleKey in value)) {
              (dom.style as any)[styleKey] = "";
            }
          }
        }
        // 새 스타일 적용
        for (const [styleKey, styleValue] of Object.entries(value)) {
          (dom.style as any)[styleKey] = styleValue;
        }
        continue;
      }

      // 일반 속성 업데이트
      if (value != null) {
        dom.setAttribute(key, String(value));
      } else {
        dom.removeAttribute(key);
      }
    }
  }
  ```

- [ ] **저장**

- [ ] **커밋:**
  ```bash
  git add packages/react/src/core/dom.ts
  git commit -m "feat: implement updateDomProps for efficient updates"
  ```

---

### Step 3.3: dom.ts - DOM 조작 헬퍼 함수들

- [x] **파일:** `packages/react/src/core/dom.ts` (이미 열려있음)

- [x] **생각하기:** "Instance에서 실제 DOM 노드 찾기, 삽입/제거 헬퍼 필요"

- [x] **코드 추가:**

  ```typescript
  import type { Instance } from "./types";

  /**
   * Instance에서 실제 DOM 노드들 추출
   */
  export function getDomNodes(instance: Instance | null): (HTMLElement | Text)[] {
    if (!instance) return [];

    // 실제 DOM이 있으면 반환
    if (instance.dom) {
      return [instance.dom];
    }

    // Fragment나 Component의 경우 자식들의 DOM 수집
    const nodes: (HTMLElement | Text)[] = [];
    for (const child of instance.children) {
      nodes.push(...getDomNodes(child));
    }
    return nodes;
  }

  /**
   * Instance의 첫 번째 DOM 노드 찾기
   */
  export function getFirstDom(instance: Instance | null): HTMLElement | Text | null {
    if (!instance) return null;

    if (instance.dom) {
      return instance.dom;
    }

    // 자식 중에서 찾기
    for (const child of instance.children) {
      const dom = getFirstDom(child);
      if (dom) return dom;
    }

    return null;
  }

  /**
   * Instance를 DOM에 삽입
   */
  export function insertInstance(
    parentDom: HTMLElement,
    instance: Instance | null,
    anchor?: HTMLElement | Text | null,
  ): void {
    if (!instance) return;

    const nodes = getDomNodes(instance);
    for (const node of nodes) {
      if (anchor) {
        parentDom.insertBefore(node, anchor);
      } else {
        parentDom.appendChild(node);
      }
    }
  }

  /**
   * Instance를 DOM에서 제거
   */
  export function removeInstance(parentDom: HTMLElement, instance: Instance | null): void {
    if (!instance) return;

    const nodes = getDomNodes(instance);
    for (const node of nodes) {
      if (node.parentNode === parentDom) {
        parentDom.removeChild(node);
      }
    }
  }
  ```

- [ ] **저장 후 타입 체크:**

  ```bash
  pnpm run type-check
  ```

- [ ] **커밋:**
  ```bash
  git add packages/react/src/core/dom.ts
  git commit -m "feat: implement DOM manipulation helper functions"
  ```

---

### Step 3.4: Phase 3 완료 체크

- [ ] **빌드 확인:**

  ```bash
  cd packages/react
  pnpm build
  ```

- [ ] **커밋:**
  ```bash
  git add .
  git commit -m "chore: complete Phase 3 - DOM interface"
  ```

---

## ⏱️ Phase 4: 렌더 스케줄링 (예상 시간: 2-3시간)

> **생각의 흐름:** 여러 setState가 연속으로 호출되어도 렌더링은 한 번만!

### Step 4.1: enqueue.ts 구현

- [x] **파일 열기:** `packages/react/src/utils/enqueue.ts`

- [x] **생각하기:** "마이크로태스크 큐를 사용해서 작업을 배치 처리"

- [x] **코드 작성:**

  ```typescript
  // 대기 중인 함수들
  const queue = new Set<Function>();

  // 스케줄링 플래그
  let isScheduled = false;

  /**
   * 함수를 마이크로태스크 큐에 추가
   * 같은 틱에 여러 번 호출되어도 한 번만 실행됨
   */
  export function enqueue<T extends (...args: any[]) => any>(func: T): void {
    queue.add(func);

    if (!isScheduled) {
      isScheduled = true;

      // 마이크로태스크로 예약
      queueMicrotask(() => {
        isScheduled = false;

        // 큐에 있는 모든 함수 실행
        const funcs = Array.from(queue);
        queue.clear();

        for (const f of funcs) {
          f();
        }
      });
    }
  }

  /**
   * 함수를 래핑하여 호출 시 자동으로 enqueue
   */
  export function withEnqueue<T extends (...args: any[]) => any>(func: T): T {
    return ((...args: any[]) => {
      enqueue(() => func(...args));
    }) as T;
  }
  ```

- [ ] **저장**

- [ ] **커밋:**
  ```bash
  git add packages/react/src/utils/enqueue.ts
  git commit -m "feat: implement microtask queue for batching"
  ```

---

### Step 4.2: render.ts 구현 (1차 - 기본 구조)

- [x] **파일 열기:** `packages/react/src/core/render.ts`

- [x] **생각하기:** "렌더링의 핵심. reconcile 호출하고 effect 실행"

- [ ] **코드 작성:**

  ```typescript
  import { context } from "./context";
  import { reconcile } from "./reconciler";
  import { withEnqueue } from "../utils/enqueue";
  import type { VNode } from "./types";

  /**
   * 루트 렌더링 함수
   */
  export function render(node: VNode | null, container: HTMLElement): void {
    // 1. Hook 방문 기록 초기화
    context.hooks.visited.clear();

    // 2. 이전 인스턴스 가져오기
    const oldInstance = context.root.instance;

    // 3. Reconciliation 수행
    const newInstance = reconcile(container, node, oldInstance);

    // 4. 새 인스턴스 저장
    context.root.instance = newInstance;

    // 5. 사용하지 않는 Hook 정리
    cleanupUnusedHooks();

    // 6. Effect 실행
    flushEffects();
  }

  /**
   * 사용하지 않는 컴포넌트의 Hook 제거
   */
  function cleanupUnusedHooks(): void {
    const { hooks } = context;
    const paths = Array.from(hooks.state.keys());

    for (const path of paths) {
      if (!hooks.visited.has(path)) {
        // 이번 렌더에서 방문하지 않은 경로는 제거
        hooks.state.delete(path);
        hooks.cursor.delete(path);
      }
    }
  }

  /**
   * 대기 중인 모든 effect 실행
   */
  function flushEffects(): void {
    const { effects } = context;
    const queue = effects.queue.slice(); // 복사
    effects.queue = []; // 초기화

    for (const effect of queue) {
      effect();
    }
  }

  /**
   * 렌더링을 예약하는 함수
   * setState에서 호출됨
   */
  export const enqueueRender = withEnqueue(() => {
    const { container, node } = context.root;
    if (container && node !== undefined) {
      render(node, container);
    }
  });
  ```

- [ ] **저장 (reconcile이 없어서 에러 나는 게 정상)**

- [ ] **커밋:**
  ```bash
  git add packages/react/src/core/render.ts
  git commit -m "feat: implement render function with effect queue"
  ```

---

### Step 4.3: Phase 4 완료 체크

- [ ] **빌드 시도:**

  ```bash
  pnpm run type-check
  # reconcile 관련 에러는 정상 (다음 Phase에서 구현)
  ```

- [ ] **커밋:**
  ```bash
  git add .
  git commit -m "chore: complete Phase 4 - Render scheduling"
  ```

---

## 🔄 Phase 5: Reconciliation (예상 시간: 5-8시간)

> **생각의 흐름:** 가장 어려운 파트! 차근차근 작은 단위로 나눠서 구현하자.

### Step 5.1: reconciler.ts - 기본 구조 잡기

- [x] **파일 열기:** `packages/react/src/core/reconciler.ts`

- [x] **생각하기:** "mount, update, unmount 세 가지 케이스로 나눠서 생각"

- [x] **코드 작성 (골격):**

  ```typescript
  import { context } from "./context";
  import { setDomProps, updateDomProps, insertInstance, removeInstance, getFirstDom } from "./dom";
  import type { VNode, Instance } from "./types";

  /**
   * Reconciliation 메인 함수
   */
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
      const newInstance = mount(container, newNode);
      unmount(container, oldInstance);
      return newInstance;
    }

    // Case 4: 타입이 같음 → 업데이트
    return update(container, newNode, oldInstance);
  }

  // 다음 단계에서 구현할 함수들
  function mount(container: HTMLElement, vnode: VNode): Instance {
    // TODO
    throw new Error("Not implemented yet");
  }

  function update(container: HTMLElement, newNode: VNode, oldInstance: Instance): Instance {
    // TODO
    throw new Error("Not implemented yet");
  }

  function unmount(container: HTMLElement, instance: Instance): void {
    // TODO
  }
  ```

- [ ] **저장**

- [ ] **커밋:**
  ```bash
  git add packages/react/src/core/reconciler.ts
  git commit -m "feat: add reconciler skeleton"
  ```

---

### Step 5.2: mount 함수 - 텍스트 노드

- [x] **파일:** `packages/react/src/core/reconciler.ts` (이미 열려있음)

- [x] **생각하기:** "가장 간단한 텍스트 노드부터 구현"

- [x] **mount 함수 수정:**

  ```typescript
  function mount(container: HTMLElement, vnode: VNode): Instance {
    // 1. 텍스트 노드 처리
    if (vnode.type === "TEXT_NODE") {
      const textNode = document.createTextNode(vnode.props.nodeValue || "");
      container.appendChild(textNode);

      return {
        vnode,
        dom: textNode,
        children: [],
      };
    }

    // 2. Fragment 처리
    if (vnode.type === Symbol.for("Fragment")) {
      const childInstances: Instance[] = [];

      for (const child of vnode.children) {
        const childInstance = mount(container, child);
        childInstances.push(childInstance);
      }

      return {
        vnode,
        dom: null, // Fragment는 DOM 없음
        children: childInstances,
      };
    }

    // 3. 컴포넌트 처리 (함수)
    if (typeof vnode.type === "function") {
      return mountComponent(container, vnode);
    }

    // 4. 일반 DOM 요소
    const dom = document.createElement(vnode.type as string);

    // Props 적용
    setDomProps(dom, vnode.props);

    // 자식들 마운트
    const childInstances: Instance[] = [];
    for (const child of vnode.children) {
      const childInstance = mount(dom, child); // 주의: container가 dom!
      childInstances.push(childInstance);
    }

    // DOM에 추가
    container.appendChild(dom);

    return {
      vnode,
      dom,
      children: childInstances,
    };
  }

  // mountComponent는 다음 단계에서
  function mountComponent(container: HTMLElement, vnode: VNode): Instance {
    throw new Error("Component mounting not implemented yet");
  }
  ```

- [ ] **저장**

- [ ] **커밋:**
  ```bash
  git add packages/react/src/core/reconciler.ts
  git commit -m "feat: implement mount for text nodes and elements"
  ```

---

### Step 5.3: unmount 함수 구현

- [x] **파일:** `packages/react/src/core/reconciler.ts`

- [x] **생각하기:** "DOM 제거하고, 자식들도 재귀적으로 unmount, cleanup 실행"

- [x] **unmount 함수 구현:**

  ```typescript
  function unmount(container: HTMLElement, instance: Instance): void {
    // 1. cleanup 함수 실행 (effect cleanup)
    if (instance.cleanup) {
      instance.cleanup();
    }

    // 2. 자식들 먼저 unmount (재귀)
    for (const child of instance.children) {
      const childContainer = instance.dom instanceof HTMLElement ? instance.dom : container;
      unmount(childContainer, child);
    }

    // 3. DOM 제거
    if (instance.dom) {
      if (instance.dom.parentNode) {
        instance.dom.parentNode.removeChild(instance.dom);
      }
    }

    // 4. 컴포넌트 Hook 정리
    if (instance.path) {
      context.hooks.state.delete(instance.path);
      context.hooks.cursor.delete(instance.path);
    }
  }
  ```

- [ ] **저장**

- [ ] **커밋:**
  ```bash
  git add packages/react/src/core/reconciler.ts
  git commit -m "feat: implement unmount with cleanup"
  ```

---

### Step 5.4: update 함수 - 기본 케이스

- [x] **파일:** `packages/react/src/core/reconciler.ts`

- [x] **생각하기:** "타입이 같을 때만 호출됨. props 업데이트하고 children reconcile"

- [x] **update 함수 구현:**

  ```typescript
  function update(container: HTMLElement, newNode: VNode, oldInstance: Instance): Instance {
    // 1. 텍스트 노드 업데이트
    if (newNode.type === "TEXT_NODE") {
      const textNode = oldInstance.dom as Text;
      const newText = newNode.props.nodeValue || "";

      if (textNode.nodeValue !== newText) {
        textNode.nodeValue = newText;
      }

      return {
        vnode: newNode,
        dom: textNode,
        children: [],
      };
    }

    // 2. Fragment 업데이트
    if (newNode.type === Symbol.for("Fragment")) {
      const newChildren = reconcileChildren(container, newNode.children, oldInstance.children);

      return {
        vnode: newNode,
        dom: null,
        children: newChildren,
      };
    }

    // 3. 컴포넌트 업데이트
    if (typeof newNode.type === "function") {
      return updateComponent(container, newNode, oldInstance);
    }

    // 4. 일반 DOM 요소 업데이트
    const dom = oldInstance.dom as HTMLElement;

    // Props 업데이트
    updateDomProps(dom, oldInstance.vnode.props, newNode.props);

    // 자식들 Reconcile
    const newChildren = reconcileChildren(dom, newNode.children, oldInstance.children);

    return {
      vnode: newNode,
      dom,
      children: newChildren,
    };
  }

  // reconcileChildren은 다음 단계에서
  function reconcileChildren(container: HTMLElement, newChildren: VNode[], oldChildren: Instance[]): Instance[] {
    // TODO: 복잡한 로직!
    throw new Error("Not implemented yet");
  }

  // updateComponent는 나중에
  function updateComponent(container: HTMLElement, newNode: VNode, oldInstance: Instance): Instance {
    throw new Error("Component update not implemented yet");
  }
  ```

- [ ] **저장**

- [ ] **커밋:**
  ```bash
  git add packages/react/src/core/reconciler.ts
  git commit -m "feat: implement update for basic cases"
  ```

---

### Step 5.5: reconcileChildren - 단순 버전

- [x] **파일:** `packages/react/src/core/reconciler.ts`

- [x] **생각하기:** "일단 key 없는 버전부터. 인덱스 기반으로 비교"

- [x] **reconcileChildren 구현 (1차):**

  ```typescript
  function reconcileChildren(container: HTMLElement, newChildren: VNode[], oldChildren: Instance[]): Instance[] {
    const newInstances: Instance[] = [];
    const maxLength = Math.max(newChildren.length, oldChildren.length);

    for (let i = 0; i < maxLength; i++) {
      const newChild = newChildren[i] || null;
      const oldChild = oldChildren[i] || null;

      // Reconcile 재귀 호출
      const newInstance = reconcile(container, newChild, oldChild);

      if (newInstance) {
        newInstances.push(newInstance);
      }
    }

    return newInstances;
  }
  ```

- [ ] **저장 후 테스트:**

  ```bash
  pnpm run test:basic
  # 일부 테스트가 통과하기 시작할 것!
  ```

- [ ] **커밋:**
  ```bash
  git add packages/react/src/core/reconciler.ts
  git commit -m "feat: implement simple reconcileChildren"
  ```

---

### Step 5.6: mountComponent 구현

- [x] **파일:** `packages/react/src/core/reconciler.ts`

- [x] **생각하기:** "컴포넌트 경로 생성, Hook 컨텍스트 설정, 함수 실행, 결과 렌더링"

- [x] **mountComponent 구현:**

  ```typescript
  let componentCounter = 0; // 컴포넌트 고유 ID

  function mountComponent(container: HTMLElement, vnode: VNode): Instance {
    // 1. 컴포넌트 경로 생성
    const parentPath =
      context.hooks.componentStack.length > 0
        ? context.hooks.componentStack[context.hooks.componentStack.length - 1]
        : "root";
    const path = `${parentPath}.c${componentCounter++}`;

    // 2. Hook 컨텍스트 설정
    context.hooks.componentStack.push(path);
    context.hooks.cursor.set(path, 0);
    context.hooks.visited.add(path);

    try {
      // 3. 컴포넌트 함수 실행
      const Component = vnode.type as Function;
      const renderedVNode = Component(vnode.props) as VNode;

      // 4. 렌더링된 VNode를 마운트
      const childInstance = mount(container, renderedVNode);

      // 5. 컴포넌트 인스턴스 생성
      return {
        vnode,
        dom: null, // 컴포넌트는 직접 DOM 없음
        children: [childInstance],
        path,
      };
    } finally {
      // 6. Hook 컨텍스트 정리
      context.hooks.componentStack.pop();
    }
  }
  ```

- [x] **저장**

- [x] **커밋:**
  ```bash
  git add packages/react/src/core/reconciler.ts
  git commit -m "feat: implement mountComponent with hook context"
  ```

---

### Step 5.7: updateComponent 구현

- [x] **파일:** `packages/react/src/core/reconciler.ts`

- [x] **생각하기:** "기존 경로 유지하면서 컴포넌트 재실행"

- [x] **updateComponent 구현:**

  ```typescript
  function updateComponent(container: HTMLElement, newNode: VNode, oldInstance: Instance): Instance {
    const path = oldInstance.path!;

    // 1. Hook 컨텍스트 복원
    context.hooks.componentStack.push(path);
    context.hooks.cursor.set(path, 0);
    context.hooks.visited.add(path);

    try {
      // 2. 컴포넌트 함수 재실행
      const Component = newNode.type as Function;
      const renderedVNode = Component(newNode.props) as VNode;

      // 3. 렌더링된 VNode를 reconcile
      const oldChildInstance = oldInstance.children[0];
      const newChildInstance = reconcile(container, renderedVNode, oldChildInstance);

      // 4. 인스턴스 업데이트
      return {
        vnode: newNode,
        dom: null,
        children: newChildInstance ? [newChildInstance] : [],
        path,
      };
    } finally {
      // 5. Hook 컨텍스트 정리
      context.hooks.componentStack.pop();
    }
  }
  ```

- [ ] **저장 후 테스트:**

  ```bash
  pnpm run test:basic
  # 더 많은 테스트가 통과할 것!
  ```

- [ ] **커밋:**
  ```bash
  git add packages/react/src/core/reconciler.ts
  git commit -m "feat: implement updateComponent"
  ```

---

### Step 5.8: Phase 5 완료 체크

- [x] **Fragment import 추가:**

  ```typescript
  // reconciler.ts 맨 위에
  import { Fragment } from "./elements";
  ```

- [x] **Fragment 비교 수정:**

  ```typescript
  // Symbol.for("Fragment") 대신
  if (vnode.type === Fragment) {
    // ...
  }
  ```

- [x] **전체 테스트:**

  ```bash
  pnpm run test:basic
  # 아직 Hook이 없어서 일부 실패하지만 렌더링 관련은 통과!
  ```

- [x] **커밋:**
  ```bash
  git add .
  git commit -m "chore: complete Phase 5 - Reconciliation"
  ```

---

## 🎣 Phase 6: 기본 Hook 시스템 (예상 시간: 4-6시간)

> **생각의 흐름:** 드디어 Hook! useState와 useEffect를 만들자.

### Step 6.1: hooks.ts - useState 구현

- [ ] **파일 열기:** `packages/react/src/core/hooks.ts`

- [ ] **생각하기:** "컴포넌트별로 Hook 상태 저장, 커서로 순서 추적"

- [ ] **코드 작성:**

  ```typescript
  import { context } from "./context";
  import { enqueueRender } from "./render";
  import { shallowEquals } from "../utils/equals";

  /**
   * 상태 관리 Hook
   */
  export function useState<T>(initialValue: T | (() => T)): [T, (newValue: T | ((prev: T) => T)) => void] {
    const { hooks } = context;

    // 1. 현재 위치
    const path = hooks.currentPath;
    const cursor = hooks.currentCursor;
    const hookList = hooks.currentHooks;

    // 2. 첫 렌더링: 초기값 설정
    if (hookList[cursor] === undefined) {
      const value = typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;

      hookList[cursor] = { value };
    }

    const hook = hookList[cursor];

    // 3. setState 함수 생성
    const setState = (newValue: T | ((prev: T) => T)) => {
      const nextValue = typeof newValue === "function" ? (newValue as (prev: T) => T)(hook.value) : newValue;

      // 값이 변경되었을 때만 리렌더링
      if (!Object.is(hook.value, nextValue)) {
        hook.value = nextValue;
        enqueueRender(); // 렌더링 예약!
      }
    };

    // 4. 커서 증가
    hooks.cursor.set(path, cursor + 1);

    return [hook.value, setState];
  }
  ```

- [ ] **저장 후 테스트:**

  ```bash
  pnpm test -- -t "useState"
  # useState 관련 테스트 통과 확인
  ```

- [ ] **커밋:**
  ```bash
  git add packages/react/src/core/hooks.ts
  git commit -m "feat: implement useState hook"
  ```

---

### Step 6.2: hooks.ts - useEffect 구현

- [ ] **파일:** `packages/react/src/core/hooks.ts` (이미 열려있음)

- [ ] **생각하기:** "deps 비교해서 변경됐으면 effect 예약, cleanup도 처리"

- [ ] **코드 추가:**

  ```typescript
  /**
   * 사이드 이펙트 Hook
   */
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void {
    const { hooks, effects } = context;

    // 1. 현재 위치
    const path = hooks.currentPath;
    const cursor = hooks.currentCursor;
    const hookList = hooks.currentHooks;

    // 2. 이전 Hook 가져오기
    const prevHook = hookList[cursor];

    // 3. 의존성 비교
    let hasChanged = true;

    if (prevHook && deps !== undefined) {
      // deps가 있고 이전 deps가 있으면 비교
      if (prevHook.deps !== undefined) {
        hasChanged = !shallowEquals(prevHook.deps, deps);
      }
    }

    // deps가 없으면 매번 실행
    if (deps === undefined) {
      hasChanged = true;
    }

    // 4. 변경되었으면 effect 예약
    if (hasChanged) {
      // 이전 cleanup 예약
      if (prevHook?.cleanup) {
        effects.queue.push(prevHook.cleanup);
      }

      // 새 effect 예약
      effects.queue.push(() => {
        const cleanup = effect();

        // cleanup 함수 저장
        if (typeof cleanup === "function") {
          const currentHookList = hooks.state.get(path);
          if (currentHookList && currentHookList[cursor]) {
            currentHookList[cursor].cleanup = cleanup;
          }
        }
      });
    }

    // 5. Hook 정보 저장
    hookList[cursor] = {
      deps: deps,
      cleanup: prevHook?.cleanup,
    };

    // 6. 커서 증가
    hooks.cursor.set(path, cursor + 1);
  }
  ```

- [ ] **저장 후 테스트:**

  ```bash
  pnpm test -- -t "useEffect"
  # useEffect 관련 테스트 통과 확인
  ```

- [ ] **커밋:**
  ```bash
  git add packages/react/src/core/hooks.ts
  git commit -m "feat: implement useEffect hook"
  ```

---

### Step 6.3: export 설정

- [x] **파일 열기:** `packages/react/src/core/index.ts`

- [x] **export 추가:**

  ```typescript
  export { createElement, Fragment } from "./elements";
  export { useState, useEffect } from "./hooks";
  export { setup } from "./setup";
  ```

- [x] **파일 열기:** `packages/react/src/index.ts`

- [x] **export 추가:**

  ```typescript
  export { createRoot } from "./client";
  export { createElement, Fragment, useState, useEffect } from "./core";
  export type { VNode } from "./core/types";
  ```

- [x] **저장**

- [x] **커밋:**
  ```bash
  git add packages/react/src/core/index.ts packages/react/src/index.ts
  git commit -m "chore: export hooks from index"
  ```

---

### Step 6.4: 기본 과제 전체 테스트

- [x] **전체 테스트 실행:**

  ```bash
  pnpm run test:basic
  ```

- [x] **결과 확인:**
  - [x] `basic.equals.test.tsx` - 모두 통과
  - [x] `basic.mini-react.test.tsx` - 모두 통과

- [ ] **실패하는 테스트가 있다면:**
  1. 에러 메시지 읽기
  2. 해당 함수로 가서 디버깅
  3. `console.log` 추가해서 값 확인
  4. 수정 후 다시 테스트

- [ ] **모든 테스트 통과 후 커밋:**
  ```bash
  git add .
  git commit -m "feat: pass all basic tests"
  ```

---

### Step 6.5: Phase 6 완료 체크

- [ ] **앱에서 확인:**

  ```bash
  cd ../../  # 루트로 이동
  pnpm dev
  ```

- [ ] **브라우저에서 확인:**
  - [ ] `http://localhost:5173` 접속
  - [ ] 제품 목록이 보이는지
  - [ ] 버튼 클릭이 작동하는지
  - [ ] 장바구니가 작동하는지

- [ ] **문제가 있다면:**
  1. 브라우저 콘솔 확인
  2. Network 탭에서 에러 확인
  3. 해당 컴포넌트에서 디버깅

- [ ] **정상 작동 확인 후 커밋:**
  ```bash
  git add .
  git commit -m "chore: complete Phase 6 - Basic Hook system"
  git push origin feat/implement-mini-react
  ```

---

## 🚀 Phase 7: 심화 과제 (예상 시간: 3-5시간)

> **생각의 흐름:** 기본 Hook을 확장해서 최적화 Hook들을 만들자!

### Step 7.1: useRef 구현

- [ ] **파일 생성:** `packages/react/src/hooks/useRef.ts`

- [ ] **생각하기:** "useState를 사용하되, 항상 같은 객체를 반환"

- [ ] **코드 작성:**

  ```typescript
  import { useState } from "../core/hooks";

  /**
   * 리렌더링 간에 유지되는 ref 객체 생성
   * ref.current를 변경해도 리렌더링이 일어나지 않음
   */
  export function useRef<T>(initialValue: T): { current: T } {
    // useState로 한 번만 생성
    const [ref] = useState(() => ({ current: initialValue }));
    return ref;
  }
  ```

- [ ] **저장**

- [ ] **커밋:**
  ```bash
  git add packages/react/src/hooks/useRef.ts
  git commit -m "feat: implement useRef hook"
  ```

---

### Step 7.2: useMemo 구현

- [ ] **파일 생성:** `packages/react/src/hooks/useMemo.ts`

- [ ] **생각하기:** "deps가 변경될 때만 factory 재실행, shallowEquals로 비교"

- [ ] **코드 작성:**

  ```typescript
  import { useState } from "../core/hooks";
  import { shallowEquals } from "../utils/equals";

  /**
   * 값을 메모이제이션하는 Hook
   * deps가 변경될 때만 factory 함수 재실행
   */
  export function useMemo<T>(factory: () => T, deps: unknown[]): T {
    const [state, setState] = useState<{ value: T; deps: unknown[] }>(() => ({
      value: factory(),
      deps,
    }));

    // deps가 변경되었는지 확인
    if (!shallowEquals(state.deps, deps)) {
      const newValue = factory();
      setState({ value: newValue, deps });
      return newValue;
    }

    return state.value;
  }
  ```

- [ ] **저장**

- [ ] **커밋:**
  ```bash
  git add packages/react/src/hooks/useMemo.ts
  git commit -m "feat: implement useMemo hook"
  ```

---

### Step 7.3: useCallback 구현

- [ ] **파일 생성:** `packages/react/src/hooks/useCallback.ts`

- [ ] **생각하기:** "useMemo로 함수를 메모이제이션하면 됨!"

- [ ] **코드 작성:**

  ```typescript
  import { useMemo } from "./useMemo";

  /**
   * 함수를 메모이제이션하는 Hook
   * deps가 변경될 때만 새 함수 반환
   */
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: unknown[]): T {
    return useMemo(() => callback, deps);
  }
  ```

- [ ] **저장**

- [ ] **커밋:**
  ```bash
  git add packages/react/src/hooks/useCallback.ts
  git commit -m "feat: implement useCallback hook"
  ```

---

### Step 7.4: useDeepMemo 구현

- [ ] **파일 생성:** `packages/react/src/hooks/useDeepMemo.ts`

- [ ] **생각하기:** "useMemo와 같은데 deepEquals 사용"

- [ ] **코드 작성:**

  ```typescript
  import { useState } from "../core/hooks";
  import { deepEquals } from "../utils/equals";

  /**
   * deepEquals로 deps를 비교하는 useMemo
   */
  export function useDeepMemo<T>(factory: () => T, deps: unknown[]): T {
    const [state, setState] = useState<{ value: T; deps: unknown[] }>(() => ({
      value: factory(),
      deps,
    }));

    // deepEquals로 비교
    if (!deepEquals(state.deps, deps)) {
      const newValue = factory();
      setState({ value: newValue, deps });
      return newValue;
    }

    return state.value;
  }
  ```

- [ ] **저장**

- [ ] **커밋:**
  ```bash
  git add packages/react/src/hooks/useDeepMemo.ts
  git commit -m "feat: implement useDeepMemo hook"
  ```

---

### Step 7.5: useAutoCallback 구현

- [ ] **파일 생성:** `packages/react/src/hooks/useAutoCallback.ts`

- [ ] **생각하기:** "실험적 기능. 함수 내부 값을 추적해서 자동 메모이제이션"

- [ ] **코드 작성:**

  ```typescript
  import { useCallback } from "./useCallback";

  /**
   * 자동으로 의존성을 추적하는 useCallback
   * (실제 React에는 없는 실험적 기능)
   *
   * 간단한 구현: 함수를 문자열로 변환해서 deps로 사용
   */
  export function useAutoCallback<T extends (...args: any[]) => any>(callback: T): T {
    // 함수를 문자열로 변환하여 deps로 사용
    const funcString = callback.toString();
    return useCallback(callback, [funcString]);
  }
  ```

- [ ] **저장**

- [ ] **커밋:**
  ```bash
  git add packages/react/src/hooks/useAutoCallback.ts
  git commit -m "feat: implement useAutoCallback hook"
  ```

---

### Step 7.6: hooks/index.ts 생성

- [ ] **파일 생성:** `packages/react/src/hooks/index.ts`

- [ ] **모든 hooks export:**

  ```typescript
  export { useRef } from "./useRef";
  export { useMemo } from "./useMemo";
  export { useCallback } from "./useCallback";
  export { useDeepMemo } from "./useDeepMemo";
  export { useAutoCallback } from "./useAutoCallback";
  ```

- [ ] **저장**

- [ ] **커밋:**
  ```bash
  git add packages/react/src/hooks/index.ts
  git commit -m "chore: create hooks index"
  ```

---

### Step 7.7: memo HOC 구현

- [ ] **파일 생성:** `packages/react/src/hocs/memo.ts`

- [ ] **생각하기:** "props가 같으면 컴포넌트 재실행 안 함, shallowEquals 사용"

- [ ] **코드 작성:**

  ```typescript
  import { shallowEquals } from "../utils/equals";
  import type { VNode } from "../core/types";

  type ComponentType<P = any> = (props: P) => VNode;

  /**
   * shallow props 비교로 컴포넌트 메모이제이션
   */
  export function memo<P extends Record<string, any>>(Component: ComponentType<P>): ComponentType<P> {
    let prevProps: P | null = null;
    let prevResult: VNode | null = null;

    const MemoizedComponent = (props: P): VNode => {
      // props가 같으면 이전 결과 재사용
      if (prevProps !== null && shallowEquals(prevProps, props)) {
        return prevResult!;
      }

      // props가 다르면 컴포넌트 재실행
      prevProps = { ...props }; // 복사
      prevResult = Component(props);
      return prevResult;
    };

    // 디버깅을 위한 displayName
    MemoizedComponent.displayName = `Memo(${Component.name || "Component"})`;

    return MemoizedComponent;
  }
  ```

- [ ] **저장**

- [ ] **커밋:**
  ```bash
  git add packages/react/src/hocs/memo.ts
  git commit -m "feat: implement memo HOC"
  ```

---

### Step 7.8: deepMemo HOC 구현

- [ ] **파일 생성:** `packages/react/src/hocs/deepMemo.ts`

- [ ] **생각하기:** "memo와 같은데 deepEquals 사용"

- [ ] **코드 작성:**

  ```typescript
  import { deepEquals } from "../utils/equals";
  import type { VNode } from "../core/types";

  type ComponentType<P = any> = (props: P) => VNode;

  /**
   * deep props 비교로 컴포넌트 메모이제이션
   */
  export function deepMemo<P extends Record<string, any>>(Component: ComponentType<P>): ComponentType<P> {
    let prevProps: P | null = null;
    let prevResult: VNode | null = null;

    const DeepMemoizedComponent = (props: P): VNode => {
      // deepEquals로 비교
      if (prevProps !== null && deepEquals(prevProps, props)) {
        return prevResult!;
      }

      prevProps = { ...props };
      prevResult = Component(props);
      return prevResult;
    };

    DeepMemoizedComponent.displayName = `DeepMemo(${Component.name || "Component"})`;

    return DeepMemoizedComponent;
  }
  ```

- [ ] **저장**

- [ ] **커밋:**
  ```bash
  git add packages/react/src/hocs/deepMemo.ts
  git commit -m "feat: implement deepMemo HOC"
  ```

---

### Step 7.9: hocs/index.ts 생성

- [ ] **파일 생성:** `packages/react/src/hocs/index.ts`

- [ ] **모든 HOC export:**

  ```typescript
  export { memo } from "./memo";
  export { deepMemo } from "./deepMemo";
  ```

- [ ] **저장**

- [ ] **커밋:**
  ```bash
  git add packages/react/src/hocs/index.ts
  git commit -m "chore: create hocs index"
  ```

---

### Step 7.10: 최종 export 설정

- [ ] **파일 열기:** `packages/react/src/index.ts`

- [ ] **모든 export 추가:**

  ```typescript
  // Client API
  export { createRoot } from "./client";

  // Core
  export { createElement, Fragment, useState, useEffect } from "./core";

  // Additional Hooks
  export { useRef, useMemo, useCallback, useDeepMemo, useAutoCallback } from "./hooks";

  // HOCs
  export { memo, deepMemo } from "./hocs";

  // Types
  export type { VNode } from "./core/types";
  ```

- [ ] **저장**

- [ ] **커밋:**
  ```bash
  git add packages/react/src/index.ts
  git commit -m "chore: add all exports to main index"
  ```

---

### Step 7.11: 심화 과제 전체 테스트

- [ ] **전체 테스트 실행:**

  ```bash
  pnpm run test
  ```

- [ ] **결과 확인:**
  - [ ] `advanced.hooks.test.tsx` - 모두 통과
  - [ ] `advanced.hoc.test.tsx` - 모두 통과

- [ ] **실패하는 테스트가 있다면 디버깅:**
  1. 테스트 파일 읽기
  2. 무엇을 테스트하는지 이해
  3. 해당 함수 수정
  4. 다시 테스트

- [ ] **모든 테스트 통과 후 커밋:**
  ```bash
  git add .
  git commit -m "feat: pass all advanced tests"
  ```

---

## 🎉 최종 확인 및 제출

### Step 8.1: 전체 테스트

- [ ] **모든 테스트 실행:**

  ```bash
  pnpm run test
  ```

- [ ] **결과:**
  - [ ] `basic.equals.test.tsx` ✅
  - [ ] `basic.mini-react.test.tsx` ✅
  - [ ] `advanced.hooks.test.tsx` ✅
  - [ ] `advanced.hoc.test.tsx` ✅

---

### Step 8.2: 앱 동작 확인

- [ ] **개발 서버 실행:**

  ```bash
  pnpm dev
  ```

- [ ] **브라우저에서 확인:** `http://localhost:5173`
  - [ ] 페이지가 정상적으로 로드됨
  - [ ] 제품 목록이 표시됨
  - [ ] 제품 카드 클릭 시 상세 페이지로 이동
  - [ ] 장바구니 추가/제거 동작
  - [ ] 수량 증가/감소 동작
  - [ ] 검색 기능 동작

- [ ] **브라우저 콘솔에 에러 없음 확인**

---

### Step 8.3: 빌드 확인

- [ ] **프로덕션 빌드:**

  ```bash
  pnpm build
  ```

- [ ] **빌드 에러 없음 확인**

- [ ] **빌드된 앱 실행:**

  ```bash
  pnpm preview
  ```

- [ ] **프리뷰에서도 정상 동작 확인**

---

### Step 8.4: 코드 정리

- [ ] **사용하지 않는 console.log 제거**

- [ ] **TODO 주석 확인 및 제거**

- [ ] **코드 포맷팅:**

  ```bash
  pnpm format
  ```

- [ ] **린트 확인:**

  ```bash
  pnpm lint
  ```

- [ ] **커밋:**
  ```bash
  git add .
  git commit -m "chore: clean up code and remove console.logs"
  ```

---

### Step 8.5: GitHub에 푸시

- [ ] **최종 푸시:**

  ```bash
  git push origin feat/implement-mini-react
  ```

- [ ] **GitHub에서 확인:**
  - [ ] 커밋이 모두 올라갔는지
  - [ ] CI가 성공했는지 (자동 실행됨)

---

### Step 8.6: Pull Request 생성

- [ ] **GitHub에서 PR 생성:**
  1. Repository 페이지로 이동
  2. "Compare & pull request" 버튼 클릭
  3. PR 템플릿 작성

- [ ] **PR 템플릿 체크리스트 작성:**

  ```markdown
  ## 과제 체크포인트

  ### 배포 링크

  https://<username>.github.io/front-7th-chapter2-2/

  ### 기본과제

  #### Phase 1: VNode와 기초 유틸리티

  - [x] `core/elements.ts`: `createElement`, `normalizeNode`, `createChildPath`
  - [x] `utils/validators.ts`: `isEmptyValue`
  - [x] `utils/equals.ts`: `shallowEquals`, `deepEquals`

  #### Phase 2: 컨텍스트와 루트 초기화

  - [x] `core/types.ts`: VNode/Instance/Context 타입 선언
  - [x] `core/context.ts`: 루트/훅 컨텍스트와 경로 스택 관리
  - [x] `core/setup.ts`: 컨테이너 초기화, 컨텍스트 리셋, 루트 렌더 트리거

  #### Phase 3: DOM 인터페이스 구축

  - [x] `core/dom.ts`: 속성/스타일/이벤트 적용 규칙, DOM 노드 탐색/삽입/제거

  #### Phase 4: 렌더 스케줄링

  - [x] `utils/enqueue.ts`: `enqueue`, `withEnqueue`로 마이크로태스크 큐 구성
  - [x] `core/render.ts`: `render`, `enqueueRender`로 루트 렌더 사이클 구현

  #### Phase 5: Reconciliation

  - [x] `core/reconciler.ts`: 마운트/업데이트/언마운트, 자식 비교, key/anchor 처리
  - [x] `core/dom.ts`: Reconciliation에서 사용할 DOM 재배치 보조 함수 확인

  #### Phase 6: 기본 Hook 시스템

  - [x] `core/hooks.ts`: 훅 상태 저장, `useState`, `useEffect`, cleanup/queue 관리
  - [x] `core/context.ts`: 훅 커서 증가, 방문 경로 기록, 미사용 훅 정리

  **기본 과제 완료 기준**: `basic.equals.test.tsx`, `basic.mini-react.test.tsx` 전부 통과 ✅

  ### 심화과제

  #### Phase 7: 확장 Hook & HOC

  - [x] `hooks/useRef.ts`: ref 객체 유지
  - [x] `hooks/useMemo.ts`, `hooks/useCallback.ts`: shallow 비교 기반 메모이제이션
  - [x] `hooks/useDeepMemo.ts`, `hooks/useAutoCallback.ts`: deep 비교/자동 콜백 헬퍼
  - [x] `hocs/memo.ts`, `hocs/deepMemo.ts`: props 비교 기반 컴포넌트 메모이제이션

  **심화 과제 완료 기준**: `advanced.hooks.test.tsx`, `advanced.hoc.test.tsx` 전부 통과 ✅
  ```

- [ ] **과제 셀프회고 작성**

- [ ] **리뷰 받고 싶은 내용 구체적으로 작성**

- [ ] **PR 제출**

---

### Step 8.7: 배포 (GitHub Pages)

- [ ] **배포 설정 (이미 되어있을 수 있음):**

  ```bash
  # vite.config.ts에서 base 설정 확인
  base: '/front_7th_chapter2-2/'
  ```

- [ ] **배포:**

  ```bash
  pnpm run deploy
  ```

- [ ] **배포 URL 확인:**

  ```
  https://<username>.github.io/front_7th_chapter2-2/
  ```

- [ ] **배포된 사이트에서 동작 확인:**
  - [ ] 모든 기능이 정상 작동
  - [ ] 콘솔 에러 없음

- [ ] **PR에 배포 링크 추가**

---

## 🎊 완료!

축하합니다! 🎉 Mini-React 구현을 완료했습니다!

### 학습 체크리스트

다음을 이해했는지 확인해보세요:

- [ ] Virtual DOM이 무엇이고 왜 필요한지
- [ ] Reconciliation 알고리즘의 원리
- [ ] Hook의 규칙이 왜 필요한지
- [ ] useState와 useEffect의 동작 방식
- [ ] 얕은 비교와 깊은 비교의 차이
- [ ] React의 렌더링 최적화 기법

### 다음 단계

- [ ] 실제 React 소스코드 읽어보기
- [ ] React Fiber 아키텍처 학습
- [ ] 성능 프로파일링 실습
- [ ] 커스텀 Hook 만들어보기

---

## 💡 문제 해결 가이드

### 테스트가 실패할 때

1. **에러 메시지 읽기**

   ```bash
   # 특정 테스트만 실행
   pnpm test -- -t "테스트명"
   ```

2. **console.log로 디버깅**

   ```typescript
   console.log("🔍", { variable });
   ```

3. **브라우저 DevTools 사용**
   ```typescript
   debugger; // 이 줄에서 멈춤
   ```

### 빌드 에러가 날 때

1. **타입 에러 확인**

   ```bash
   pnpm run type-check
   ```

2. **의존성 재설치**

   ```bash
   rm -rf node_modules
   pnpm install
   ```

3. **캐시 삭제**
   ```bash
   rm -rf .vite
   rm -rf dist
   ```

### 앱이 작동하지 않을 때

1. **브라우저 콘솔 확인**
2. **Network 탭에서 에러 확인**
3. **React DevTools로 컴포넌트 트리 확인**

---

**이제 체크리스트를 따라 하나씩 완료해보세요!** 🚀
