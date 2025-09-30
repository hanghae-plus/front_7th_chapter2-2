# React 구현 과제 문서

React의 핵심 기능을 직접 구현해보며 내부 동작 원리를 이해하기 위한 종합 가이드입니다.

## 📚 문서 구성

### [01. 구현 가이드](./01-implementation-guide.md)
- **함수 인터페이스**: 각 모듈별 타입 시그니처와 책임
- **수도코드**: 렌더링, 훅, 비교 로직의 전체 흐름
- **단계별 로드맵**: 기본·심화 과제에 맞춘 구현 체크포인트

### [02. 시퀀스 다이어그램](./02-sequence-diagrams.md)
- **기본 플로우**: 루트 초기화, 렌더, 훅 실행, Reconciliation
- **심화 플로우**: 고급 훅(useMemo/useRef/useAutoCallback)과 HOC 처리
- **시각 자료**: 주요 함수 호출 순서와 데이터 이동을 다이어그램으로 정리

### [03. 기초 지식](./03-fundamental-knowledge.md)
- **VNode & 경로 모델**: JSX 정규화와 key/경로 규칙
- **렌더 사이클**: 컨텍스트 초기화, 렌더 예약, 훅 정리 절차
- **리컨실리에이션 전략**: 자식 비교, anchor 계산, Fragment 다루기
- **DOM 상호작용**: 속성·스타일·이벤트 업데이트 패턴
- **Hook 컨텍스트**: 상태 저장 구조와 useState/useEffect 규칙
- **스케줄링 & 유틸**: 마이크로태스크 큐, equality 함수, memo 패턴

## 🎯 학습 목표

이 과제를 통해 다음을 이해할 수 있습니다:

- **Virtual DOM**의 동작 원리와 Reconciliation 알고리즘
- **React Hooks**의 내부 구현과 상태 관리 메커니즘
- **컴포넌트 생명주기**와 렌더링 최적화 기법
- **메모이제이션**과 **HOC** 패턴의 구현 원리
- **JavaScript 기반 DOM 조작**과 이벤트 처리 전략

## 🚀 시작하기

1. **기초 지식 학습**: [03-fundamental-knowledge.md](./03-fundamental-knowledge.md)로 필수 개념 정리
2. **시퀀스 이해**: [02-sequence-diagrams.md](./02-sequence-diagrams.md)에서 전체 호출 흐름 파악
3. **단계별 구현**: [01-implementation-guide.md](./01-implementation-guide.md)의 체크리스트에 따라 진행

## 📋 구현 체크리스트

### ✅ 기본 과제
- [ ] **Phase 1 · VNode와 기초 유틸리티** (`core/constants.ts`, `core/elements.ts`, `utils/equals.ts`, `utils/validators.ts`)
  - `TEXT_ELEMENT`, `Fragment` 등의 심볼 정의
  - `isEmptyValue`, `shallowEquals`, `deepEquals` 등 공용 유틸 구현
  - `createElement`, `normalizeNode`, `createChildPath`로 JSX → VNode 정규화
- [ ] **Phase 2 · 컨텍스트와 루트 초기화** (`core/context.ts`, `core/types.ts`, `core/setup.ts`, `client/index.ts`)
  - 루트/훅 컨텍스트 구조 정의 및 초기화
  - `setup`으로 루트 렌더 흐름 구축, `createRoot` 노출
- [ ] **Phase 3 · DOM 인터페이스** (`core/dom.ts`)
  - 속성/스타일/이벤트 업데이트 규칙 구현
  - DOM 노드 탐색·삽입·제거 유틸 완성
- [ ] **Phase 4 · 렌더 스케줄링** (`utils/enqueue.ts`, `core/render.ts`)
  - 마이크로태스크 기반 스케줄러(`withEnqueue`) 작성
  - `render`/`enqueueRender`로 루트 렌더 사이클 구성
- [ ] **Phase 5 · Reconciliation** (`core/reconciler.ts`)
  - 노드 타입별 마운트/업데이트/언마운트 로직 구현
  - 자식 비교, key 매칭, anchor 계산으로 DOM 이동 최소화
- [ ] **Phase 6 · 기본 Hook 시스템** (`core/hooks.ts`)
  - 훅 커서·경로 추적과 상태 저장 구조 완성
  - `useState`, `useEffect`, 이펙트 큐/cleanup, 미사용 훅 정리

**기본 과제 완료 기준**: `basic.equals.test.tsx`, `basic.mini-react.test.tsx` 전부 통과

### 🚀 심화 과제
- [ ] **Phase 7 · 확장 Hook & HOC** (`hooks/*.ts`, `hocs/*.ts`)
  - `useRef`, `useMemo`, `useCallback`, `useDeepMemo`, `useAutoCallback`
  - `memo`, `deepMemo` 고차 컴포넌트로 렌더 최적화

**심화 과제 완료 기준**: `advanced.hooks.test.tsx`, `advanced.hoc.test.tsx` 전부 통과

## 🧪 테스트 가이드

```bash
# 기본 과제 검증
npm test basic.equals.test.tsx
npm test basic.mini-react.test.tsx

# 심화 과제 검증
npm test advanced.hooks.test.tsx
npm test advanced.hoc.test.tsx

# 전체 테스트
npm test
```

## 💡 주요 개념

### Virtual DOM
JavaScript 객체로 표현된 가상의 DOM 트리. 실제 DOM 조작의 비용을 줄이기 위해 사용됩니다.

### Reconciliation
이전 Virtual DOM과 새로운 Virtual DOM을 비교하여 실제 DOM에 최소한의 변경만 적용하는 과정입니다.

### Hooks
함수형 컴포넌트에서 상태와 생명주기 기능을 사용할 수 있게 해주는 메커니즘입니다. 호출 순서가 보장되어야 합니다.

### 컴포넌트 패스
각 컴포넌트 인스턴스를 고유하게 식별하기 위한 경로입니다. (`"0.c0.i1.c2"` 형식)

## 🔧 디버깅 팁

### 상태 추적
```javascript
console.log('Component path:', hooks.currentPath);
console.log('Hook cursor:', hooks.currentCursor);
console.log('Current state:', hooks.currentHooks);
```

### 렌더링 추적
```javascript
console.log('Reconciling:', {
  newType: newNode?.type,
  oldType: oldInstance?.node?.type
});
```

### 의존성 비교
```javascript
console.log('Deps changed:', {
  prev: prevDeps,
  next: nextDeps,
  equal: shallowEquals(prev, next)
});
```

## 📖 참고 자료

- [React 공식 문서](https://react.dev/)
- [React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture)
- [Virtual DOM and Internals](https://reactjs.org/docs/faq-internals.html)

---

이 문서들을 통해 React의 내부 동작 원리를 깊이 이해하고, 실제로 동작하는 React 구현체를 만들어보세요! 🚀
