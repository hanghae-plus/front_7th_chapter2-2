# 심화 과제 요구사항

## 목표

- 추가 Hook(useRef, useMemo, useCallback 등)을 구현할 수 있다
- Higher-Order Component(HOC)를 이용한 최적화 기법을 적용할 수 있다
- 깊은 비교(deep comparison)를 활용한 고급 메모이제이션을 구현할 수 있다

## 과제 완료 기준

`advanced.hooks.test.tsx`, `advanced.hoc.test.tsx` 전부 통과

## 구현 Phase

### Phase 7: 확장 Hook & HOC

**구현 파일:**

#### 추가 Hooks
- `hooks/useRef.ts`: ref 객체 유지
- `hooks/useMemo.ts`: shallow 비교 기반 메모이제이션
- `hooks/useCallback.ts`: shallow 비교 기반 함수 메모이제이션
- `hooks/useDeepMemo.ts`: deep 비교 기반 메모이제이션
- `hooks/useAutoCallback.ts`: deep 비교/자동 콜백 헬퍼

#### HOCs (Higher-Order Components)
- `hocs/memo.ts`: shallow props 비교 기반 컴포넌트 메모이제이션
- `hocs/deepMemo.ts`: deep props 비교 기반 컴포넌트 메모이제이션

**목표:**
- React의 성능 최적화 Hook과 HOC 구현
- 얕은 비교와 깊은 비교의 차이 이해 및 적용

## 함수 인터페이스

### Hooks 모듈 (`packages/react/src/hooks/`)

#### useRef.ts

```tsx
/**
 * 리렌더링 간에도 유지되는 변경 가능한 ref 객체를 생성합니다.
 * ref 객체의 .current 프로퍼티를 변경해도 리렌더링을 트리거하지 않습니다.
 */
export function useRef<T>(initialValue: T): { current: T }
```

#### useMemo.ts

```tsx
/**
 * 계산 비용이 높은 값을 메모이제이션합니다.
 * deps 배열의 값이 변경될 때만 factory 함수를 재실행합니다.
 * deps 비교는 shallowEquals를 사용합니다.
 */
export function useMemo<T>(factory: () => T, deps: unknown[]): T
```

#### useCallback.ts

```tsx
/**
 * 함수를 메모이제이션합니다.
 * deps 배열의 값이 변경될 때만 새 함수를 생성합니다.
 * deps 비교는 shallowEquals를 사용합니다.
 */
export function useCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: unknown[]
): T
```

#### useDeepMemo.ts

```tsx
/**
 * deepEquals를 사용하여 의존성을 비교하는 useMemo입니다.
 * 중첩된 객체나 배열의 깊은 비교가 필요할 때 사용합니다.
 */
export function useDeepMemo<T>(factory: () => T, deps: unknown[]): T
```

#### useAutoCallback.ts

```tsx
/**
 * 콜백 함수의 의존성을 자동으로 추적하여 메모이제이션합니다.
 * deps를 명시하지 않아도 함수 내부에서 사용하는 값들을 추적합니다.
 * (실제 React에는 없는 실험적 기능입니다)
 */
export function useAutoCallback<T extends (...args: any[]) => any>(
  callback: T
): T
```

### HOCs 모듈 (`packages/react/src/hocs/`)

#### memo.ts

```tsx
/**
 * 컴포넌트의 props가 변경되지 않으면 리렌더링을 건너뜁니다.
 * props 비교는 shallowEquals를 사용합니다.
 * 
 * @param Component - 메모이제이션할 컴포넌트
 * @returns 메모이제이션된 컴포넌트
 */
export function memo<P extends Record<string, any>>(
  Component: React.ComponentType<P>
): React.ComponentType<P>
```

#### deepMemo.ts

```tsx
/**
 * deepEquals를 사용하여 props를 비교하는 memo입니다.
 * props에 중첩된 객체나 배열이 많을 때 사용합니다.
 * 
 * @param Component - 메모이제이션할 컴포넌트
 * @returns 메모이제이션된 컴포넌트
 */
export function deepMemo<P extends Record<string, any>>(
  Component: React.ComponentType<P>
): React.ComponentType<P>
```

## 구현 가이드

### useRef 구현 힌트

```jsx
function useRef(initialValue) {
  // 1. useState를 활용
  //    - ref 객체는 { current: initialValue } 형태
  //    - 한 번 생성되면 변경되지 않음 (identity 유지)

  // 2. 초기화는 한 번만
  //    - lazy initialization을 활용
  //    - useState(() => ({ current: initialValue }))

  // 3. ref.current 변경은 리렌더링을 트리거하지 않음
  //    - 단순히 객체의 프로퍼티만 변경되므로 자동으로 동작
}
```

### useMemo 구현 힌트

```jsx
function useMemo(factory, deps) {
  // 1. 이전 deps와 계산된 값을 저장
  //    - useState 또는 전역 상태 활용
  //    - { deps: prevDeps, value: memoizedValue } 형태

  // 2. deps 비교
  //    - shallowEquals로 이전 deps와 비교
  //    - 변경되었으면 factory() 재실행

  // 3. 메모이제이션된 값 반환
  //    - deps가 같으면 저장된 값 반환
  //    - deps가 다르면 새로 계산한 값 반환 및 저장
}
```

### useCallback 구현 힌트

```jsx
function useCallback(callback, deps) {
  // useMemo를 활용하면 간단히 구현 가능
  // useMemo(() => callback, deps)와 동일
}
```

### memo HOC 구현 힌트

```jsx
function memo(Component) {
  // 1. 이전 props 저장
  //    - 컴포넌트 외부에 WeakMap 또는 클로저 활용

  // 2. Wrapper 컴포넌트 생성
  //    - props를 받아서 shallowEquals로 비교
  //    - 같으면 이전 렌더 결과 재사용
  //    - 다르면 Component를 새로 렌더링

  // 3. 최적화 처리
  //    - 첫 렌더링은 무조건 실행
  //    - 이후 렌더링은 props 비교 후 결정
  
  return function MemoizedComponent(props) {
    // 구현...
  }
}
```

## 테스트 실행

```bash
# 심화 과제 테스트
pnpm test advanced.hooks.test.tsx
pnpm test advanced.hoc.test.tsx
```

## 주의사항

### useRef
- `ref.current`를 변경해도 리렌더링이 발생하지 않아야 함
- 동일한 ref 객체의 identity가 유지되어야 함

### useMemo / useCallback
- deps 배열이 비어있으면 최초 1회만 실행
- deps가 없으면(undefined) 매번 재실행
- 순환 참조나 무한 루프 방지 필요

### memo / deepMemo
- props가 동일하면 컴포넌트 함수가 실행되지 않아야 함
- children prop도 비교 대상에 포함
- displayName 설정으로 디버깅 편의성 제공

### deepEquals 성능
- 깊은 비교는 비용이 높으므로 필요한 경우에만 사용
- 순환 참조 처리 고려
- 객체 깊이가 깊을수록 성능 저하

## 실무 적용 팁

1. **useRef 활용**
   - DOM 요소 참조
   - 이전 값 저장
   - 타이머 ID 보관

2. **useMemo 활용**
   - 복잡한 계산 결과 캐싱
   - 자식 컴포넌트에 전달할 객체/배열 생성
   - 정렬/필터링 결과 메모이제이션

3. **useCallback 활용**
   - 자식 컴포넌트에 전달할 콜백 함수
   - useEffect의 의존성에 들어가는 함수
   - 이벤트 핸들러 최적화

4. **memo 활용**
   - Pure Component 최적화
   - 리스트 아이템 컴포넌트
   - 비싼 렌더링 비용을 가진 컴포넌트

