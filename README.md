## 과제 체크포인트

### 배포 링크
[https://rlacodud.github.io/front_7th_chapter2-2](https://rlacodud.github.io/front_7th_chapter2-2)

<!--
배포 링크를 적어주세요
예시: https://<username>.github.io/front-7th-chapter2-2/

배포가 완료되지 않으면 과제를 통과할 수 없습니다.
배포 후에 정상 작동하는지 확인해주세요.
-->

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

---

## 과제 셀프회고

<!-- 과제에 대한 회고를 작성해주세요 -->
### 챕터2에 대한 회고
챕터1에 대한 회고를 작성한 게 엊그제같은데 벌써 챕터2에 대한 회고를 작성하고 있다니 시간이 빠르다는 걸 체감하게 됩니다.

챕터2는 **건강과의 사투**였던 것 같습니다.

하필 챕터2를 시작하면서 눈과 전체적인 체력에 이슈가 생겨서 챕터1 때와 비교했을 때 상대적으로 시간과 체력을 덜 투자하게 되어 아쉬움이 많습니다.
특히 제가 좋아하는 javascript를 활용하는 주차였기에 더욱 아쉬움이 큰 것 같습니다.

그럼에도 **아하 모먼트가 많았던, 짜릿한 챕터**였기도 한 것 같습니다.

챕터1 테스트코드는 **초면이었던 상대를 알아가는** 과정이었다면,
챕터2는 이미 알고 있던, **친숙한 친구에 대해 제대로 이해하고 알아가는** 과정이었던 것 같습니다.

javascript의 이벤트 위임, react의 가상돔, 재조정 과정 등 단순한 정의만으로 알고 있던 개념들을 과제를 진행하며 체화할 수 있었습니다!

---
### 아하! 모먼트 (A-ha! Moment)
<!--
과제를 진행하며 "아!" 하고 깨달음을 얻었던 순간이 있다면 공유해주세요.
어떤 부분에서 어려움을 겪다가, 어떤 계기로 개념이 명확해졌나요?
(예: "useState의 클로저와 호출 순서의 관계를 디버깅하며 비로소 이해했습니다.")
-->

### 기술적 성장
<!--
- 이번 과제를 통해 새로 학습한 개념은 무엇인가요?
- 기존에 알고 있던 지식이 어떻게 더 깊어졌나요?
- 구현 과정에서 마주친 기술적 도전과, 이를 어떻게 해결했나요?
-->
### 🤔 가상돔(Virtual DOM)과 Diff 알고리즘, 그리고 React의 내부 동작 흐름
**“React는 어떻게 이전 DOM과 현재 DOM의 차이를 알아내고,
필요한 부분만 최소한으로 업데이트할까?”**

이 과제를 시작하기 전까지는 막연히
가상돔이 있다는 건 알고 있지만, 실제론 어떻게 구현된 걸까?라는 의문이 있었습니다.

과제를 통해 직접 React를 만들면서 **React 구조의 원리를 코드 단위로 체감**할 수 있었고 아래는 구현 과정에서 가장 핵심적인 흐름들에 대해 정리한 내용입니다.

#### 1. 가상돔(Virtual DOM)이란?
브라우저의 실제 DOM은 조작하는 데 비용이 큰 구조이다.
이 때문에 React는 바로 DOM을 조작하지 않고,
우선 메모리 상에 DOM의 **추상화된 형태(VDOM)**를 만든 뒤, 변경점을 계산하여 **필요한 부분만** 실제 DOM에 반영한다.

**React의 기본 렌더 과정**
1. 상태 변경
2. 새로운 Virtual DOM 생성
3. 이전 Virtual DOM과 비교(Diff 알고리즘)
4. 바뀐 부분만 실제 DOM 업데이트(Reconciliation)
=> 이 전체 과정이 실제로는 아주 빠르게 일어나며,
=> React는 이 과정을 통해 DOM 조작 비용을 획기적으로 줄일 수 있다.

#### 2. Virtual DOM은 어떻게 생겼을까?
다음 HTML이 있다고 하자
```jsx
<div id="app">
  <ul>
    <li>
      <input type="checkbox" class="toggle" />
      todo list item 1
      <button class="remove">삭제</button>
    </li>
  </ul>
</div>

```
React는 이를 **JS 객체** 형태의 VNode로 표현한다:
```
{
  type: "div",
  props: { id: "app" },
  children: [
    {
      type: "ul",
      children: [
        {
          type: "li",
          children: [
            { type: "input", props: { type: "checkbox", className: "toggle" } },
            "todo list item 1",
            { type: "button", props: { className: "remove" }, children: ["삭제"] }
          ]
        }
      ]
    }
  ]
}

```
이처럼 DOM을 **순수 JS 객체로 추상화**함으로써
브라우저 환경에 종속되지 않고 비교 로직을 효율적으로 수행할 수 있게 된다.

#### 3. JSX와 createElement()
그러나 위와 같이 객체로 표현됐을 때 문제점은 **가독성**이다.
우리가 그동안 봐왔던 HTML 구조를 표현하는 방식과 다르기에 어떤 depth로, 어떤 방식으로 구성되어있는지 **한눈에 파악하기 어렵다.**

이를 해결하기 위해 JSX라는 것이 등장한다.
```jsx
<div>
  <span>{count}</span>
</div>
```
위 코드는 컴파일되면 다음과 같은 createElement() 호출로 변환된다:
```
createElement("div", null,
  createElement("span", null, count)
);
```
그리고 이 createElement가 **Virtual DOM 노드를 생성**한다.

#### 4. Diff 알고리즘(Reconciliation)의 핵심 규칙
React의 Diff 알고리즘은 트리를 전체 비교하지 않는다.
대신 몇 가지 단순하지만 강력한 규칙을 사용한다!

##### 4-1) 타입이 같으면 같은 노드로 본다
```jsx
<div class="a" />  
→ <div class="b" /> 
```
=> DOM은 유지, props만 업데이트됨.

##### 4-2) 타입이 다르면 완전히 다른 노드로 본다
```jsx
<div /> → <span />
```
→ 기존 DOM 제거 후 새로운 DOM 생성.

##### 4-3) 리스트는 key로 비교한다
이 규칙이 가장 중요하다.

**key가 없으면?**
리스트를 단순히 앞에서부터 순서대로 비교한다.
```jsx
[a, b, c] → [b, c, d]
```
- a ↔ b (다름 → 교체)
- b ↔ c (다름 → 교체)
- c ↔ d (다름 → 교체)
즉, 전부 새로 만든다 => 매우 비효율적

**key가 있으면?**
```jsx
[{key:a}, {key:b}, {key:c}]
→
[{key:b}, {key:a}, {key:c}]
```
React는 key를 기준으로 매칭한다:

```bash
b 재사용, 위치만 이동
a 재사용, 위치만 이동
c는 그대로
```
=> DOM 재사용 + 위치만 재배치(최적화)

#### 5. Diff 알고리즘 전체 흐름 정리
React의 Reconciliation은 다음 단계로 이루어진다.

1️⃣ 루트 비교
- 타입이 같으면 자식 비교로 진행,
- 다르면 전체 노드를 새로 교체.

2️⃣ 자식 비교
- 부모 타입이 같으면 **children을 순회**하며 비교 시작.

3️⃣ 단일 노드 비교
- 타입이 같으면 → update
- 타입이 다르면 → replace
- 텍스트면 → textContent 변경

4️⃣ 리스트 처리
- key 기반으로 매칭
=> 재사용 가능한 인스턴스는 그대로 두고
=> 순서만 조정하거나 제거/추가 결정

#### 6. React 전체 렌더링 사이클의 흐름
React 내부에서는 렌더링이 아래 순서로 진행된다:

1️⃣ JSX → createElement()
=> Virtual DOM 생성

2️⃣ Virtual DOM → Reconciliation
=> 이전 VDOM과 비교하여 변경점 계산

3️⃣ DOM Patch
=> 필요한 부분만 실제 DOM에 반영

4️⃣ Hooks 관리
- useState: 상태 저장 및 커서 기반 관리
- useEffect: 렌더 이후에 실행되도록 큐에 저장
- cleanup: 언마운트 시 정리

5️⃣ Effect Flush
렌더가 끝나면 effect queue를 비우고 **이펙트와 cleanup을 실행**한다.

### 코드 품질
#### 만족스러운 부분
- VNode 생성(createElement)의 구조화된 처리
- normalizeNode 로직 내에서 명확하게 역할 분리
- reconciler에서 mount/update/unmount 흐름 처리

**리팩토링하고 싶은 부분**
- Reconciler의 분기가 많아서 추후 가독성 개선이 필요해보입니다.

<!-- 예시
- 특히 만족스러운 구현
- 리팩토링이 필요한 부분
- 코드 설계 관련 고민과 결정
-->

---

### 학습 효과 분석
#### ✅ 테스트코드를 통한 코드 역추론 경험
가상돔을 만드는 데 가장 핵심적인 `core/elements.ts` 파일의 `createElement` 함수를 구현할 때 **테스트코드를 통한 코드 역추론**의 경험을 했습니다.

제공되었던 기본 코드 구조를 확인해보면 type, originProps, rawChildren을 매개변수로 받고 각 매개변수의 type이 명시되어있습니다.

```ts
/**
 * JSX로부터 전달된 인자를 VNode 객체로 변환합니다.
 * 이 함수는 JSX 변환기에 의해 호출됩니다. (예: Babel, TypeScript)
 */
export const createElement = (
  type: string | symbol | React.ComponentType<any>,
  originProps?: Record<string, any> | null,
  ...rawChildren: any[]
) => {
  // 여기를 구현하세요.
};
 ```

이 함수는 **VNode 객체로 변환**하는 역할을 한다고 했고 테스트코드를 확인해보면 해당 함수의 결과가 어떤 방식으로 return되어야 하는지 확인할 수 있습니다.

아래가 가장 기본적인 return 형태의 구조로 보이고 이제 아래의 함수 활용방식과 expect값을 통해 어떤 방식으로 처리해줘야 할지 추론할 수 있습니다.

1. 첫번째 인자인 type은 그대로 type으로 들어간다.
2. key는 지정하지 않으면 null로 들어간다.
3. 두번째 인자였던 originProps는 props 내부에 속성이 적용되고
4. 그 이후의 인자인 rawChildren은 props.children 내부에
해당값의 type인 TEXT_ELEMENT로 type이 정의되고 key는 역시나 null값, 그 내부에 보내줬던 string값 "Hello"가 nodeValue로 들어가는 걸 확인할 수 있다.

```ts
const vNode = createElement("div", { id: "test" }, "Hello");
expect(vNode).toEqual({
  type: "div",
  key: null,
  props: {
    id: "test",
    children: [
      {
        type: TEXT_ELEMENT,
        key: null,
        props: { children: [], nodeValue: "Hello" },
      },
    ],
  },
});
 ```

위와 같이 추론한 내용을 바탕으로 아래와 같이 코드를 작성할 수 있습니다.

type이나 originProps에 대한 부분은 간단히 처리할 수 있지만 중요한 부분은 **rawChildren**을 처리하는 부분입니다.
rawChildren은 세번째 인자부터 몇개가 넘어오든 처리해야 하는 값이므로 우선 **배열의 평탄화**가 필요하고
flat으로 평탄화 처리를 한 뒤 배열을 순회하며 각 요소를 **VNode 형식으로 정규화**합니다.

이 때 Fragment에 대한 처리가 필요한데, 그 외의 노드는 그대로 push해주면 되지만 **Fragment는 wrapper 없이 children만 전달**하는 컨테이너이기에 children을 넘겨줘야 하기 때문입니다.

```ts
/**
 * JSX로부터 전달된 인자를 VNode 객체로 변환합니다.
 * 이 함수는 JSX 변환기에 의해 호출됩니다. (예: Babel, TypeScript)
 */
export const createElement = (
  type: string | symbol | React.ComponentType<any>,
  originProps?: Record<string, any> | null,
  ...rawChildren: any[]
) => {
  // originProps에서 key만 분리하고,
  // key를 제외한 나머지 속성만 props에 남김
  const { key = null, ...props } = originProps ?? {};

  // children을 담을 배열
  const normalizedChildren: VNode[] = [];

  // 배열 평탄화
  const flat = rawChildren.flat(Infinity);
  // 배열 순회
  for (const child of flat) {
    // VNode 형식으로 정규화
    const normalized = normalizeNode(child);

    // null(렌더링 불가 값)인 경우 continue
    if (!normalized) continue;

    // Fragment type일 경우
    // children 요소 push
    if (normalized.type === Fragment) {
      const fragmentChildren = normalized.props?.children ?? [];
      normalizedChildren.push(...fragmentChildren);
    } else {
      // 그 외, 본인 node push
      normalizedChildren.push(normalized);
    }
  }

  // children이 없으면 props에 children을 넣지 않음
  if (normalizedChildren.length === 0) {
    return {
      type,
      key,
      props: {
        ...props,
      },
    };
  }

  return {
    type,
    key,
    props: {
      ...props,
      children: normalizedChildren,
    },
  };
};
```
<!-- 예시
- 가장 큰 배움이 있었던 부분
- 추가 학습이 필요한 영역
- 실무 적용 가능성
-->

---

### 과제 피드백
#### 좋았던 점
- React의 동작 흐름을 이해할 수 있었다!
- 테스트 코드가 있어서 구현 방향을 잡는 데 큰 도움이 되었다!
- 기본 => 심화 흐름이 자연스럽고 학습 곡선이 잘 맞춰져 있었다!

#### 어려웠던 점
- reconciler는 로직 분기가 많아 처음 진입 장벽이 있었다!
- hooks의 cursor/visited/state 구조를 이해하는 데 시간이 조금 걸렸다!

<!-- 예시
- 과제에서 모호하거나 애매했던 부분
- 과제에서 좋았던 부분
-->

## 리뷰 받고 싶은 내용
- Reconciler에서 mount/update/unmount 분기 구조의 개선 여지가 있을지 궁금합니다!
- hooks/state 저장 구조(Map 기반 path 관리)가 더 효율적으로 개선될 수 있을지 궁금합니다!
- memo/deepMemo HOC에서 더 안정적이거나 React와 유사한 방식이 있을지 궁금합니다!

---

자세한 구현 과정과 회고는 아래 블로그에 정리했습니다! 😊
[WIL 5주차_Chapter2-2. 나만의 React 만들기](https://chaeng03.tistory.com/entry/%ED%95%AD%ED%95%B499-WIL-5%EC%A3%BC%EC%B0%A8Chapter2-2-%EB%82%98%EB%A7%8C%EC%9D%98-React-%EB%A7%8C%EB%93%A4%EA%B8%B0)
[5주차_Vanilla JS로 나만의 React 만들기](https://chaeng03.tistory.com/entry/%ED%95%AD%ED%95%B499-5%EC%A3%BC%EC%B0%A8Vanilla-JS%EB%A1%9C-%EB%82%98%EB%A7%8C%EC%9D%98-React-%EB%A7%8C%EB%93%A4%EA%B8%B0)

<!--
피드백 받고 싶은 내용을 구체적으로 남겨주세요
모호한 요청은 피드백을 남기기 어렵습니다.

참고링크: https://chatgpt.com/share/675b6129-515c-8001-ba72-39d0fa4c7b62

모호한 요청의 예시)
- 코드 스타일에 대한 피드백 부탁드립니다.
- 코드 구조에 대한 피드백 부탁드립니다.
- 개념적인 오류에 대한 피드백 부탁드립니다.
- 추가 구현이 필요한 부분에 대한 피드백 부탁드립니다.

구체적인 요청의 예시)
- 현재 함수와 변수명을 보면 직관성이 떨어지는 것 같습니다. 함수와 변수를 더 명확하게 이름 지을 수 있는 방법에 대해 조언해주실 수 있나요?
- 현재 파일 단위로 코드가 분리되어 있지만, 모듈화나 계층화가 부족한 것 같습니다. 어떤 기준으로 클래스를 분리하거나 모듈화를 진행하면 유지보수에 도움이 될까요?
- MVC 패턴을 따르려고 했는데, 제가 구현한 구조가 MVC 원칙에 맞게 잘 구성되었는지 검토해주시고, 보완할 부분을 제안해주실 수 있을까요?
- 컴포넌트 간의 의존성이 높아져서 테스트하기 어려운 상황입니다. 의존성을 낮추고 테스트 가능성을 높이는 구조 개선 방안이 있을까요?
-->
