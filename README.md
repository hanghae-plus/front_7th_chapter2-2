# 4팀 곽정원: Chapter2-2. 나만의 React 만들기

## 과제 요구사항

### 기본과제

#### 가상돔을 기반으로 렌더링하기

- [ ] createVNode 함수를 이용하여 vNode를 만든다.
- [ ] normalizeVNode 함수를 이용하여 vNode를 정규화한다.
- [ ] createElement 함수를 이용하여 vNode를 실제 DOM으로 만든다.
- [ ] 결과적으로, JSX를 실제 DOM으로 변환할 수 있도록 만들었다.

#### 이벤트 위임

- [ ] 노드를 생성할 때 이벤트를 직접 등록하는게 아니라 이벤트 위임 방식으로 등록해야 한다
- [ ] 동적으로 추가된 요소에도 이벤트가 정상적으로 작동해야 한다
- [ ] 이벤트 핸들러가 제거되면 더 이상 호출되지 않아야 한다

### 심화 과제

#### Diff 알고리즘 구현

- [ ] 초기 렌더링이 올바르게 수행되어야 한다
- [ ] diff 알고리즘을 통해 변경된 부분만 업데이트해야 한다
- [ ] 새로운 요소를 추가하고 불필요한 요소를 제거해야 한다
- [ ] 요소의 속성만 변경되었을 때 요소를 재사용해야 한다
- [ ] 요소의 타입이 변경되었을 때 새로운 요소를 생성해야 한다

## 과제 요구사항 세부사항

### 1) createVNode 함수 작성

```jsx
function createVNode(type, props, ...children) {
}
```

1. type, props, ...children을 매개변수로 받는 함수를 작성하세요.
2. 반환값은 { type, props, children } 형태의 객체여야 합니다.

### 2) normalizeVNode 함수 작성

```jsx
function normalizeVNode(vNode) {
}
```

주어진 가상 노드(vNode)를 표준화된 형태로 변환하는 역할을 합니다. 이 함수는 다양한 타입의 입력을 처리하여 일관된 형식의 가상 노드를 반환하여 DOM 조작이나 렌더링 과정에서 일관된 데이터 구조를 사용할 수 있도록 합니다.

1. vNode가 null, undefined 또는 boolean 타입일 경우 빈 문자열을 반환합니다.
2. vNode가 문자열 또는 숫자일 경우 문자열로 변환하여 반환합니다.
3. vNode의 타입이 함수일 경우 해당 함수를 호출하여 반환된 결과를 재귀적으로 표준화합니다.
4. 그 외의 경우, vNode의 자식 요소들을 재귀적으로 표준화하고, null 또는 undefined 값을 필터링하여 반환합니다.

### 3) createElement 함수 작성

```jsx
function updateAttributes($el, props) {}

export function createElement(vNode) {}
```

1. vNode가 null, undefined, boolean 일 경우, 빈 텍스트 노드를 반환합니다.
2. vNode가 문자열이나 숫자면 텍스트 노드를 생성하여 반환합니다.
3. vNode가 배열이면 DocumentFragment를 생성하고 각 자식에 대해 createElement를 재귀 호출하여 추가합니다.
4. 위 경우가 아니면 실제 DOM 요소를 생성합니다:
    - vNode.type에 해당하는 요소를 생성
    - vNode.props의 속성들을 적용 (이벤트 리스너, className, 일반 속성 등 처리)
    - vNode.children의 각 자식에 대해 createElement를 재귀 호출하여 추가

### 4) eventManager 함수 작성

```jsx
export function setupEventListeners(root) {}

export function addEvent(element, eventType, handler) {}

export function removeEvent(element, eventType, handler) {}

```

1. addEvent와 removeEvent를 통해 element에 대한 이벤트 함수를 어딘가에 저장하거나 삭제합니다.
2. setupEventListeners를 이용해서 이벤트 함수를 가져와서 한 번에 root에 이벤트를 등록합니다.

### 5) renderElement 함수 작성

```jsx
export function renderElement(vNode, container) {
  // vNode를 정규화 한 다음에
  // createElement로 노드를 만들고
  // container에 삽입하고
	  // 이벤트를 등록합니다.
}
```

- renderElement는 앞에서 작성된 함수들을 조합하여 vNode를 container에 렌더링하는 작업을 수행합니다.

## 개발 워크플로우

### Issue-Driven Development

이 프로젝트는 Issue 기반 개발을 따릅니다.

#### 이슈 생성 규칙
- 파일 위치: `ISSUES/{number}-{TYPE}-{description}.md`
- 형식 예시: `ISSUES/002-FEAT-implement-vnode.md`

#### 이슈 템플릿 (`markdowns/issue-template/ISSUE_TEMPLATE.md` 참고)
```markdown
## Description
<!-- 이슈에 대한 간단한 설명을 작성해주세요 -->

## Todo
- [ ] 작업 1
- [ ] 작업 2
- [ ] 작업 3

## ETC
<!-- 추가 정보나 참고사항이 있다면 작성해주세요 -->
```

#### 브랜치 네이밍
- 형식: `{type}/{issue-number}/{description}`
- 예시: `feat/002/implement-vnode`

#### 커밋 컨벤션
- 형식: `Type(issue-number): Description`
- 영문 제목 + 한글 상세 내용
- 예시:
```
Feat(002): Implement createVNode function

가상 DOM 노드 생성 함수 구현

- type, props, children을 받아 vNode 객체 반환
- JSX 변환을 위한 기본 구조 설정
```

### 프로젝트 구조 및 설정

- **설정 파일**: `CLAUDE.md` - Claude Code 개발 가이드라인
- **페르소나**: `.claude/DEVELOPER.md`, `.claude/REVIEWER.md`
- **코딩 표준**: `markdowns/coding-standards/CODING_STANDARDS.md`
- **리뷰 템플릿**: `markdowns/review-templates/REVIEW_TEMPLATES.md`