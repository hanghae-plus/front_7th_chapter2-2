# React 유사 프레임워크 구현 규칙

## 📋 프로젝트 목표

**최종 목표**: 모든 테스트 코드 통과

## 🎯 핵심 규칙

1. **주석 필수**: 각 함수 구현 시 이해할 수 있는 한글 주석을 반드시 추가해야 함
2. **순차 진행**: Phase는 반드시 순서대로 진행 (Phase 1 → Phase 2 → ... → Phase 6)
3. **Phase 완료 시 확인**: 각 Phase가 완료되면 반드시 사용자에게 확인(confirm)을 받고 다음 Phase로 진행
4. **주석 기반 구현**: 코드에 달려있는 주석을 보고 하나하나 차근차근 구현
5. **테스트 중심**: 구현 후 테스트 통과 여부 확인

## 📂 구현 순서 (Phase별)

### Phase 1 · VNode와 기초 유틸리티

**파일 목록**:

- `core/elements.ts`: `createElement`, `normalizeNode`, `createChildPath`
- `utils/validators.ts`: `isEmptyValue`
- `utils/equals.ts`: `shallowEquals`, `deepEquals`

**설명**:

- VNode(가상 DOM 노드) 생성 및 정규화
- 기초 유틸리티 함수 구현 (값 비교, 빈 값 체크 등)

---

### Phase 2 · 컨텍스트와 루트 초기화

**파일 목록**:

- `core/context.ts`: 루트/훅 컨텍스트와 경로 스택 관리
- `core/setup.ts`: 컨테이너 초기화, 컨텍스트 리셋, 루트 렌더 트리거
- `client/index.ts`: `createRoot().render()` API 노출

**설명**:

- 전역 컨텍스트 관리 시스템 구현
- 렌더링 루트 초기화 및 설정

---

### Phase 3 · DOM 인터페이스 구축

**파일 목록**:

- `core/dom.ts`: 속성/스타일/이벤트 적용 규칙, DOM 노드 탐색/삽입/제거

**설명**:

- 실제 DOM 조작 함수 구현
- 속성, 스타일, 이벤트 핸들러 처리

---

### Phase 4 · 렌더 스케줄링

**파일 목록**:

- `utils/enqueue.ts`: `enqueue`, `withEnqueue`로 마이크로태스크 큐 구성
- `core/render.ts`: `render`, `enqueueRender`로 루트 렌더 사이클 구현

**설명**:

- 비동기 렌더링 스케줄링 시스템
- 마이크로태스크를 이용한 배치 업데이트

---

### Phase 5 · Reconciliation

**파일 목록**:

- `core/reconciler.ts`: 마운트/업데이트/언마운트, 자식 비교, key/anchor 처리
- `core/dom.ts`: Reconciliation에서 사용할 DOM 재배치 보조 함수 확인

**설명**:

- Virtual DOM diffing 알고리즘
- 효율적인 DOM 업데이트

---

### Phase 6 · 기본 Hook 시스템

**파일 목록**:

- `core/hooks.ts`: 훅 상태 저장, `useState`, `useEffect`, cleanup/queue 관리
- `core/context.ts`: 훅 커서 증가, 방문 경로 기록, 미사용 훅 정리

**설명**:

- useState, useEffect 등 기본 훅 구현
- 훅의 상태 관리 및 생명주기 처리

---

## 🚀 심화 과제 (Advanced)

### 1) 기본 훅 구현

**파일 목록**:

- `hooks/useRef.ts`: ref 객체 유지
- `hooks/useMemo.ts`: shallow 비교 기반 메모이제이션
- `hooks/useCallback.ts`: 함수 메모이제이션

**설명**:

- **useRef**: 렌더링 간 변경되지 않는 참조 객체 반환
- **useMemo**: 계산 비용이 큰 함수의 결과를 메모이제이션
- **useCallback**: 함수를 메모이제이션하여 불필요한 재생성 방지

---

### 2) 커스텀 훅 구현

**파일 목록**:

- `hooks/useDeepMemo.ts`: deep 비교 기반 메모이제이션
- `hooks/useAutoCallback.ts`: 의존성을 지정하지 않아도 동작하는 자동 콜백 헬퍼

**설명**:

- **useDeepMemo**: `deepEquals`를 사용하여 의존성을 깊게 비교
- **useAutoCallback**:
  - 콜백함수가 **참조하는 값은 항상 렌더링 시점에 최신화**되어야 한다
  - 대신 항상 **동일한 참조를 유지**해야 한다 (useCallback 활용)
  - React 19.2에 `useEffectEvent`라는 이름으로 추가됨
  - 참고: [React 19.2 – useEffectEvent](https://react.dev/blog/2025/10/01/react-19-2#use-effect-event)

**구현 힌트**:

- useRef로 최신 함수를 저장하고, useCallback으로 안정적인 참조 유지

---

### 3) HOC (High Order Component)

**파일 목록**:

- `hocs/memo.ts`: props 비교 기반 컴포넌트 메모이제이션
- `hocs/deepMemo.ts`: 모든 props를 deep 비교를 통해 메모이제이션

**설명**:

- **memo**: props가 변경되지 않으면 이전 렌더링 결과 재사용 (shallow 비교)
- **deepMemo**: props를 깊게 비교하여 메모이제이션

**구현 방식**:

- useRef를 사용하여 이전 props와 렌더링 결과 저장
- equals 함수로 props 비교하여 재렌더링 여부 결정

---

## ✅ 체크리스트

### 기본 과제

- [x] Phase 1: VNode와 기초 유틸리티
- [x] Phase 2: 컨텍스트와 루트 초기화
- [x] Phase 3: DOM 인터페이스 구축
- [x] Phase 4: 렌더 스케줄링
- [x] Phase 5: Reconciliation
- [x] Phase 6: 기본 Hook 시스템
- [x] Basic 테스트 60개 통과

### 심화 과제

- [x] 기본 훅: useRef, useMemo, useCallback
- [x] 커스텀 훅: useDeepMemo, useAutoCallback
- [x] HOC: memo, deepMemo
- [x] Advanced 테스트 12개 통과

### 최종

- [x] **전체 72개 테스트 통과** ✅

## 🔄 작업 진행 방식

1. 각 Phase의 파일들을 순서대로 구현
2. 주석으로 달린 구현 사항들을 하나씩 구현
3. 코드에 이해하기 쉬운 한글 주석 추가
4. Phase 완료 후 **반드시 사용자에게 확인 요청**
5. 사용자 승인 후 다음 Phase로 진행

## 📝 구현 시 주의사항

- 함수 구현 시 동작 원리를 설명하는 주석 필수
- React의 동작 방식과 유사하게 구현
- 테스트 케이스를 참고하여 정확한 동작 구현
- 엣지 케이스 고려 (null, undefined, 빈 배열 등)
