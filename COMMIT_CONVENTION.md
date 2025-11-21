# 커밋 컨벤션

> Mini-React 프로젝트 커밋 메시지 작성 규칙

## 기본 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Type (필수)

| Type         | 설명                         | 예시                                        |
| ------------ | ---------------------------- | ------------------------------------------- |
| **feat**     | 새로운 기능 추가             | `feat(hooks): useState 구현`                |
| **fix**      | 버그 수정                    | `fix(reconciler): 자식 재조정 버그 수정`    |
| **refactor** | 리팩토링 (기능 변경 없음)    | `refactor(dom): props 업데이트 로직 단순화` |
| **test**     | 테스트 추가/수정             | `test(hooks): useEffect deps 테스트 추가`   |
| **docs**     | 문서 수정                    | `docs: 구현 가이드 업데이트`                |
| **style**    | 코드 포맷팅 (세미콜론, 공백) | `style: prettier 포맷팅 적용`               |
| **chore**    | 빌드, 설정 변경              | `chore: vite 설정 업데이트`                 |
| **perf**     | 성능 개선                    | `perf(reconciler): children diff 최적화`    |

## Scope (선택)

| Scope     | 설명                                     |
| --------- | ---------------------------------------- |
| **core**  | 핵심 로직 (setup, render, reconciler)    |
| **hooks** | Hook 시스템 (useState, useEffect 등)     |
| **hocs**  | Higher-Order Components (memo, deepMemo) |
| **dom**   | DOM 조작 관련                            |
| **utils** | 유틸리티 함수                            |
| **types** | 타입 정의                                |
| **test**  | 테스트                                   |

## Subject 규칙

- **50자 이내**
- **한글 사용** (권장)
- **명령형**: "구현", "수정", "추가" (O), "구현했음", "수정함" (X)
- **마침표 없음**

## Body (선택)

- 72자마다 줄바꿈
- "무엇을", "왜" 변경했는지 설명
- "어떻게"는 코드로 설명

## Footer (선택)

- **Breaking Changes**: `BREAKING CHANGE: 설명`
- **Issue 참조**: `Closes #123`, `Refs #456`

## 예시

### 기본 예시

```bash
# 기능 추가
feat(hooks): useState Hook 구현

# 버그 수정
fix(reconciler): reconcileChildren 무한 루프 방지

# 리팩토링
refactor(dom): setDomProps 헬퍼 함수 추출

# 테스트
test(hooks): useState 업데이트 테스트 케이스 추가

# 문서
docs: 트러블슈팅 가이드 추가

# Phase 완료
chore: Phase 1 완료 - VNode와 유틸리티
```

### 상세 예시

```bash
feat(hooks): cleanup 기능이 있는 useEffect 구현

deps 배열을 shallowEquals로 비교하고,
이전 effect의 cleanup을 실행한 후 새 effect를 예약합니다.

Closes #12
```

## Phase별 커밋 패턴

### Phase 1 (유틸리티)

```bash
feat(utils): isEmptyValue 구현
feat(utils): shallowEquals 구현
feat(utils): deepEquals 구현
feat(core): createElement 구현
chore: Phase 1 완료
```

### Phase 2 (컨텍스트)

```bash
feat(types): 핵심 타입 정의
feat(context): 전역 컨텍스트 구현
feat(setup): 루트 setup 구현
feat(client): createRoot API 구현
chore: Phase 2 완료
```

### Phase 3-6 (동일 패턴)

```bash
feat(scope): 기능명 구현
fix(scope): 버그명 수정
refactor(scope): 로직명 개선
chore: Phase N 완료
```

## 커밋 전 회고 작성 (필수)

### 규칙

모든 커밋 전에 **반드시** 회고 파일을 먼저 작성합니다.

### 회고 파일 작성 방법

1. **위치**: `review/` 폴더
2. **파일명**: `01-구현한기능.md`, `02-해결한문제.md` (한글, 순서대로)
3. **내용**: 한글로 작성
4. **커밋하지 않음**: `.gitignore`에 포함됨

### 회고 내용

다음 중 하나 이상 작성:

- **고민한 내용**: "왜 이 방식을 선택했는가?"
- **해결한 문제**: "어떤 문제가 있었고, 어떻게 해결했는가?"
- **배운 점**: "이번 구현으로 무엇을 배웠는가?"
- **대안**: "다른 방법은 없었을까?"
- **질문/답변**: "AI에게 질문한 내용과 답변"
- **참고 자료**: "어떤 문서를 참고했는가?"

### 회고 파일 예시

```markdown
# 01-useState-구현.md

## 고민한 내용

Q: Hook의 상태를 어떻게 저장할까?
A: Map<path, HookState[]>로 컴포넌트별로 격리하기로 결정

Q: 커서는 왜 필요한가?
A: 같은 컴포넌트에서 여러 Hook을 호출할 때 순서를 추적하기 위해

## 해결한 문제

문제: setState 호출 시 무한 루프 발생
원인: Object.is로 값 비교를 안 해서 매번 리렌더링
해결: Object.is로 이전 값과 비교 후 변경됐을 때만 enqueueRender

## 배운 점

- Hook은 호출 순서가 중요하다
- 클로저를 활용해 상태를 캡슐화할 수 있다
- 불변성이 중요하다 (새 값 반환)
```

### 목적

- PR 작성 시 **회고 내용 참고**
- 나중에 **고민했던 내용 기억**
- 학습 과정 **문서화**

---

## 커밋 단위

### 원칙

- **하나의 커밋 = 하나의 논리적 변경**
- **테스트가 통과하는 상태로 커밋**
- **Phase 완료 시 반드시 커밋**
- **회고 파일을 먼저 작성한 후 커밋**

### 예시

```bash
# ✅ Good - 논리적으로 독립적
git commit -m "feat(hooks): useState 구현"
git commit -m "feat(hooks): useEffect 구현"

# ❌ Bad - 여러 기능을 한 커밋에
git commit -m "feat(hooks): useState와 useEffect 구현"
```

## 금지 사항

### 모호한 메시지

```bash
# ❌ Bad
git commit -m "버그 수정"
git commit -m "업데이트"
git commit -m "WIP"
git commit -m "작업중"

# ✅ Good
git commit -m "fix(reconciler): unmount에서 null 참조 방지"
```

### Scope 누락

```bash
# ❌ Bad
git commit -m "feat: useState 구현"

# ✅ Good
git commit -m "feat(hooks): useState 구현"
```

### Type 없음

```bash
# ❌ Bad
git commit -m "useState 구현"

# ✅ Good
git commit -m "feat(hooks): useState 구현"
```

### AI 언급 금지

```bash
# ❌ Bad - AI 도움 명시
git commit -m "feat(hooks): useState 구현 (AI 도움)"
git commit -m "fix: Claude 도움으로 버그 해결"
git commit -m "refactor: Cursor AI 사용해서 코드 개선"

# ✅ Good - 구현 내용만
git commit -m "feat(hooks): useState 구현"
git commit -m "fix(reconciler): null 참조 오류 해결"
git commit -m "refactor(dom): props 업데이트 로직 단순화"
```

**이유**: 커밋 히스토리는 **무엇을 했는지**만 기록. AI 도움 여부는 중요하지 않음.

## 도구

### Commitlint (선택)

```bash
# 설치
pnpm add -D @commitlint/cli @commitlint/config-conventional

# commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional']
};
```

### 커밋 템플릿

```bash
# .gitmessage
# <type>(<scope>): <subject>
#
# <body>
#
# <footer>

git config commit.template .gitmessage
```

## 참고

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit)
