## 과제 체크포인트

### 배포 링크

https://nohyr.github.io/front_7th_chapter2-2/

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

**기본 과제 완료 기준**: `basic.equals.test.tsx`, `basic.mini-react.test.tsx` 전부 통과

### 심화과제

#### Phase 7: 확장 Hook & HOC

- [x] `hooks/useRef.ts`: ref 객체 유지
- [x] `hooks/useMemo.ts`, `hooks/useCallback.ts`: shallow 비교 기반 메모이제이션
- [x] `hooks/useDeepMemo.ts`, `hooks/useAutoCallback.ts`: deep 비교/자동 콜백 헬퍼
- [x] `hocs/memo.ts`, `hocs/deepMemo.ts`: props 비교 기반 컴포넌트 메모이제이션

## 과제 셀프회고

<!-- 과제에 대한 회고를 작성해주세요 -->

### 아하! 모먼트 (A-ha! Moment)

**1. 컴포넌트 경로의 중요성**

- **문제**: Footer 컴포넌트의 상태가 Item 개수 변화 시 초기화되는 버그 발생
- **원인**: 절대 인덱스 기반 경로(`0.i3.cFooter`)가 형제 개수에 따라 변경됨
- **해결**: 타입 기반 인덱싱 도입 - 같은 타입 중 몇 번째인지 계산하여 경로 생성
- **깨달음**: React의 key prop이 왜 중요한지, 컴포넌트 identity가 렌더링 최적화에 어떤 영향을 미치는지 체감

**2. 클로저 캡처의 중요성**

- **문제**: useState의 setState가 잘못된 컴포넌트의 상태를 업데이트
- **원인**: setState 함수가 생성 시점의 path/cursor를 캡처하지 않아 호출 시점의 context 참조
- **해결**: `const capturedPath = path; const capturedCursor = cursor;` 로 클로저 캡처
- **깨달음**: JavaScript 클로저의 스코프 체인과 렉시컬 환경이 어떻게 동작하는지 명확히 이해

**3. Reconciliation의 효율성**

- **깨달음**: key 기반 매칭과 anchor 기반 DOM 이동 최소화가 React 성능의 핵심
- 자식 재조정 시 `usedOldChildren` Set으로 중복 매칭 방지
- anchor 계산으로 DOM 노드를 정확한 위치에 삽입하여 불필요한 재배치 방지

### 기술적 성장

**1. TypeScript 활용 능력 향상**

- Generic 타입 제약과 타입 가드를 활용한 안전한 함수 구현
- `VNode`, `Instance`, `Context` 등 복잡한 타입 구조 설계 및 유지

**2. 함수형 프로그래밍 패턴 적용**

- 고차 함수(`withEnqueue`, `memo`)를 활용한 관심사 분리
- 불변성 유지와 순수 함수 작성으로 디버깅 용이성 확보

**3. 알고리즘 설계 능력**

- Map/Set 자료구조를 활용한 효율적인 자식 매칭 알고리즘 구현
- 재귀 구조(Fragment, Component 순회)를 깔끔하게 처리

### 코드 품질

**1. 모듈화 및 단일 책임 원칙**

- 각 파일이 명확한 책임을 가짐 (elements → VNode 생성, reconciler → DOM 조정, hooks → 상태 관리)
- 400줄 이상의 reconciler.ts도 함수 단위로 분리되어 가독성 유지

**2. 주석과 문서화**

- 모든 주요 함수에 JSDoc 스타일 주석 작성
- 복잡한 로직(reconcileChildren, createChildPath)에는 단계별 설명 추가

**3. 테스트 커버리지**

- 72개 테스트 100% 통과
- Edge case(null 노드, 빈 children, 타입 변경)까지 모두 검증됨

**4. 성능 최적화**

- `Object.is`를 활용한 빠른 equality 체크
- 마이크로태스크 큐로 렌더링 중복 방지
- key 기반 매칭으로 DOM 조작 최소화

### 학습 효과 분석

**1. React 내부 동작 완전 이해**

- 이전에는 "React는 Virtual DOM을 쓴다" 정도만 알았지만, 이제는:
  - Reconciliation 알고리즘의 구체적인 로직
  - Hook이 클로저와 배열 인덱스로 구현되는 원리
  - 렌더링 스케줄링과 마이크로태스크 활용법
  - Fragment와 Component의 DOM-less 처리 방식
- 를 코드 레벨로 설명할 수 있음

**2. 실무 적용 가능한 지식**

- useMemo/useCallback을 언제 써야 하는지 명확히 이해
- key prop의 중요성과 리스트 렌더링 최적화 전략
- 컴포넌트 메모이제이션의 트레이드오프 (shallow vs deep 비교)

**3. 디버깅 능력 향상**

- React DevTools가 어떻게 작동하는지 유추 가능
- 상태 업데이트가 왜 다음 렌더에 반영되는지 이해
- "Hooks must be called in the same order" 경고의 원인 파악

### 과제 피드백

이번 과제를 진행하면서 단계별 체크포인트와 풍부한 테스트 덕분에 학습 흐름이 명확했고, 실제 React와 유사한 구조를 직접 구현해보며 내부 동작 원리를 깊이 이해할 수 있었다. 특히 72개의 테스트를 모두 통과시키는 과정에서 다양한 엣지 케이스를 다루는 법을 배웠고, 타입 기반 경로 안정성이나 상태 유지와 같은 세부적인 구현 이슈를 해결하면서 기술적 사고의 범위가 확장되었다. 이러한 경험을 통해 앞으로 프레임워크나 라이브러리를 선택할 때 단순한 사용성뿐 아니라 내부 구조와 동작 방식까지 고려하게 되는 시야를 갖추게 된 점이 가장 큰 성장이라고 느꼈다.

## 리뷰 받고 싶은 내용

**1. Hook 상태 관리**

```typescript
const setState = (nextValue: T | ((prev: T) => T)) => {
  const hooks = context.hooks.state.get(capturedPath);
  if (!hooks) return;
  const newValue = typeof nextValue === "function" ? (nextValue as (prev: T) => T)(hooks[capturedCursor]) : nextValue;
  if (Object.is(hooks[capturedCursor], newValue)) return;
  hooks[capturedCursor] = newValue;
  enqueueRender();
};
```

- Map 대신 WeakMap을 쓰면 메모리 관리가 더 나아질까요?
- 실제 React는 어떤 자료구조로 Hook 상태를 관리하나요?

**2. Reconciliation 최적화**

```typescript
const reconcileChildren = (
  parentDom: HTMLElement,
  oldChildren: (Instance | null)[],
  newChildren: VNode[],
  parentPath: string,
): (Instance | null)[] => {
  // key 기반 매칭 → 타입 기반 매칭 → 재조정
};
```

- 자식이 많을 때(1000개 이상) 성능 문제가 있을까요?
- React의 실제 Diff 알고리즘과 비교했을 때 빠진 최적화는 무엇인지 궁금해요.
