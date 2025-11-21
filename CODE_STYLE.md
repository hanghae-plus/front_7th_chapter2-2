# Mini-React 코딩 스타일 가이드

> React의 핵심을 구현하며 배우는 깔끔한 TypeScript 코드

## 1. 네이밍 규칙

### 타입

- **PascalCase**: `VNode`, `Instance`, `Context`, `HookState`
- **Interface**: `ComponentType<P>`

### 변수

- **camelCase**: `currentPath`, `hookList`, `newInstance`
- **Boolean**: `is/has/should/can` 접두사
  - `isComponent`, `hasChanged`, `shouldUpdate`, `canRender`

### 함수

- **camelCase + 동사**: `mount`, `unmount`, `reconcile`, `setDomProps`
- **Hook**: `use` 접두사 - `useState`, `useEffect`, `useMemo`
- **Private**: 언더스코어 접두사 - `_cleanup`, `_updateCursor`

### 상수

- **UPPER_SNAKE_CASE**: `MAX_DEPTH`, `DEFAULT_STATE`
- **Symbol**: camelCase - `Fragment`

## 2. 함수 작성

### 길이 제한

- **함수**: 30줄 이내
- **파일**: 200줄 이내
- 초과 시 분리 또는 주석으로 이유 명시

### Early Return 패턴

```typescript
function reconcile(container, newNode, oldInstance) {
  if (newNode === null) return handleUnmount(oldInstance);
  if (oldInstance === null) return handleMount(container, newNode);
  if (isDifferentType(newNode, oldInstance)) return handleReplace(...);
  return handleUpdate(...);
}
```

### JSDoc

```typescript
/**
 * VNode를 실제 DOM으로 마운트합니다
 *
 * @param container - DOM을 추가할 부모 요소
 * @param vnode - 마운트할 가상 DOM 노드
 * @returns 생성된 Instance 객체
 */
```

## 3. 타입 안전성

### any 금지

- ❌ `any` 사용 금지
- ✅ `unknown` 사용 후 타입 가드

### 제네릭 활용

```typescript
function useState<T>(initialValue: T | (() => T)): [T, Dispatcher<T>];
function useMemo<T>(factory: () => T, deps: unknown[]): T;
```

### 타입 가드

```typescript
const isComponent = (type: VNode["type"]): type is Function => {
  return typeof type === "function";
};
```

## 4. 재조정 패턴

### 4가지 케이스 명확히 구분

1. **Unmount**: `newNode === null`
2. **Mount**: `oldInstance === null`
3. **Replace**: `type` 또는 `key` 다름
4. **Update**: `type`과 `key` 동일

### 불변성 유지

- 항상 새 배열/객체 반환
- 원본 수정 금지

```typescript
// ✅ Good
const newInstances = oldInstances.map(update);
return [...newInstances, newInstance];

// ❌ Bad
oldInstances.push(newInstance);
return oldInstances;
```

## 5. Hook 구현

### Hook 규칙 강제

```typescript
get currentPath(): string {
  if (this.componentStack.length === 0) {
    throw new Error("Hook은 컴포넌트 내부에서만 호출 가능합니다");
  }
  return this.componentStack[this.componentStack.length - 1];
}
```

### 상태 캡슐화

- Context를 통한 간접 접근
- Private 상태, Public API

## 6. Import 순서

```typescript
// 1. 타입
import type { VNode, Instance } from "./types";

// 2. 내부 모듈 (알파벳 순)
import { context } from "./context";
import { reconcile } from "./reconciler";

// 3. DOM/Utils
import { setDomProps } from "./dom";
import { shallowEquals } from "../utils/equals";

// 4. 상수
import { Fragment } from "./constants";
```

## 7. 체크리스트

### 타입

- [ ] `any` 대신 `unknown` 사용
- [ ] 제네릭 활용
- [ ] 반환 타입 명시

### 함수

- [ ] 30줄 이내
- [ ] Early return 사용
- [ ] JSDoc 작성 (export 함수)
- [ ] 단일 책임

### 재조정

- [ ] 4가지 케이스 구분
- [ ] 불변성 유지
- [ ] 타입 안전

### Hook

- [ ] 규칙 강제
- [ ] 상태 캡슐화
- [ ] 커서 관리

### 파일

- [ ] 200줄 이내
- [ ] Import 순서
- [ ] 단일 책임
