## 가상 DOM과 렌더링 흐름 쉬운 설명

이 프로젝트에서는 **가상 DOM(Virtual DOM)** 을 직접 구현해서 화면을 그립니다.  
이 문서는 **코딩을 막 시작한 사람**도 이해할 수 있도록, 한 단계씩 쉽게 설명합니다.

---

## 1. 우리가 궁극적으로 하고 싶은 일

브라우저 화면에 이런 UI를 만든다고 생각해 봅시다.

```jsx
<div className="item">
  <span>사과</span>
  <button onClick={handleClick}>추가</button>
</div>
```

브라우저 입장에서는 결국 이런 **진짜 DOM** 을 만들어야 합니다.

```html
<div class="item">
  <span>사과</span>
  <button>추가</button>
</div>
```

그리고 나중에 데이터가 바뀌어서 `"사과"` → `"배"` 로 바뀌면,

- `<span>사과</span>` 이 부분만 **살짝 바꾸면** 됩니다.
- `<div>`나 `<button>` 은 그대로 두고, **필요한 부분만 최소한으로 수정**하는 게 중요합니다.

이걸 자동으로 해 주는 것이 **가상 DOM + diff(비교) 알고리즘** 입니다.

---

## 2. 이 문서에서 설명하는 파일들

- `src/lib/createVNode.js`
- `src/lib/normalizeVNode.js`
- `src/lib/createElement.js`
- `src/lib/updateElement.js`
- `src/lib/renderElement.js`
- `src/lib/eventManager.js`

이 파일들이 합쳐져서:

1. 화면에 처음 그리기
2. 데이터가 바뀌었을 때 **필요한 부분만** 업데이트
3. 이벤트(onClick, onChange 등) 처리

를 담당합니다.

---

## 3. VNode: 화면에 그리고 싶은 것의 설계도

### 3-1. VNode가 뭐예요?

**VNode(가상 노드)** 는 “화면에 이런 걸 그리고 싶어요”를 **자바스크립트 객체로 표현한 것**입니다.

예를 들어, 이런 UI:

```jsx
<button className="primary" onClick={handleClick}>
  클릭
</button>
```

을 VNode로 표현하면 대략 이렇게 생겼다고 볼 수 있습니다.

```js
const vNode = {
  type: "button", // 어떤 태그인지 (div, span, button 등)
  props: {
    // 속성들 (className, onClick 등)
    className: "primary",
    onClick: handleClick,
  },
  children: ["클릭"], // 안에 들어가는 내용들 (텍스트 / 또 다른 VNode 들)
};
```

이렇게 **트리(tree) 구조**로 화면 전체를 표현한 것을 **가상 DOM** 이라고 부릅니다.

---

## 4. `createVNode` – VNode 설계도 만들기

파일: `src/lib/createVNode.js`

이 함수는 우리가 JSX/함수 컴포넌트로 UI를 작성했을 때, **VNode 객체를 만들어 주는 역할**을 합니다.

중요한 부분만 쉽게 정리하면:

- `type` : `"div"`, `"button"` 같은 태그 이름 또는 함수 컴포넌트
- `props` : `className`, `onClick`, `id` 같은 속성 객체
- `children` :
  - 중첩 배열일 수도 있고 (`[["텍스트"], [다른VNode]]`)
  - `null`, `undefined`, `false`, `true` 같은 값이 섞여 있을 수도 있음

현재 구현에서는:

- `children.flat(Infinity)` 으로 **모든 중첩 배열을 한 줄로 펼침**
- `null`, `undefined`, `false`, `true` 는 **렌더링할 필요가 없으니 제거**

그래서 결과적으로:

- **화면에 그릴 수 있는 값들만** `children` 배열에 깔끔하게 남게 됩니다.

---

## 5. `normalizeVNode` – VNode를 깨끗하게 정리하기

파일: `src/lib/normalizeVNode.js`

`normalizeVNode` 의 목표:

> 다양한 형태의 입력(vNode, 함수 컴포넌트, 숫자/문자열 등)을  
> **렌더링하기 좋은, 정리된 형태**로 맞춰 주기

쉽게 설명하면:

- **1) 아무것도 아닌 값들 → 빈 문자열**
  - `null`, `undefined`, `true`, `false` → `""`
- **2) 숫자 → 문자열**
  - `123` → `"123"`
- **3) 문자열은 그대로 유지**
  - `"안녕"` → `"안녕"`
- **4) 함수 컴포넌트 처리**
  - `vNode.type` 이 함수(`function`)라면, 이 함수를 실제로 호출
  - 그 결과를 다시 `normalizeVNode` 에 넣어서  
    **컴포넌트 안에 또 컴포넌트가 있어도 끝까지 펼쳐서 처리**
- **5) 일반 VNode 객체 처리**
  - `children` 각각에 `normalizeVNode` 를 적용
  - `null`, `undefined`, `""` 같은 필요 없는 값은 필터링

이 과정을 통해:

- 최종적으로 **"화면을 만들기 좋게 잘 정리된 VNode"** 가 만들어집니다.

---

## 6. `createElement` – VNode → 진짜 DOM으로 만들기

파일: `src/lib/createElement.js`

`createElement(vNode)` 는 **VNode 설계도 → 브라우저가 이해하는 진짜 DOM** 으로 바꿔 줍니다.

큰 흐름은 이렇게 보면 됩니다.

1. **기본 타입들 처리**
   - `null`, `undefined`, `boolean` → 빈 텍스트 노드 `""`
   - 문자열 → 그 내용을 가진 텍스트 노드
   - 숫자 → `String(숫자)` 로 변환한 텍스트 노드
2. **배열인 경우**
   - `DocumentFragment` 를 하나 만들고
   - 각 자식에 대해 `createElement` 를 재귀 호출해서 fragment에 붙임
   - 마지막에 fragment를 반환 → 나중에 한 번에 DOM에 추가
3. **일반 VNode(객체)인 경우**
   - `document.createElement(vNode.type)` 으로 실제 DOM 요소 만듦
   - `updateAttributes` 로 `props` 적용
     - 이벤트(onClick 등), className, 일반 속성, 체크박스 같은 boolean 속성 등
   - `vNode.children` 각각에 대해 `createElement` 재귀 호출해서 자식으로 추가

결국, `createElement` 는:

> “이 VNode를 실제 브라우저에 붙일 수 있는 DOM으로 바꿔줘”  
> 라는 역할을 합니다.

---

## 7. `eventManager` – 이벤트(onClick 등) 관리하기

파일: `src/lib/eventManager.js`

이 파일은 **onClick, onChange 같은 이벤트를 한 곳에서 관리**하기 위한 코드입니다.

### 7-1. 왜 이렇게 복잡하게 하나요?

모든 버튼에 직접 `button.addEventListener("click", ...)` 를 붙이면:

- 버튼이 100개면 리스너도 100개
- 나중에 버튼이 사라지거나 바뀔 때 **리스너를 관리하기가 힘듦**

그래서 이 프로젝트는:

- **루트 컨테이너 하나에만 이벤트 리스너를 달고**
- 실제 클릭된 요소에서 부모 방향으로 올라가며  
  “이 요소에 등록된 핸들러가 있으면 실행” 하는 방식(이벤트 위임)을 사용합니다.

### 7-2. 핵심 개념

- `registeredEventTypes` : 어떤 이벤트 타입들이 등록되었는지 기록 (`"click"`, `"change"` 등)
- 각 DOM 요소에 `__events` 라는 숨겨진 속성에  
  `element.__events[eventType] = [handler1, handler2, ...]` 형태로 저장

### 7-3. 중요한 함수들

- `addEvent(element, eventType, handler)`
  - 예: `eventType = "click"`
  - `registeredEventTypes` 에 이 타입을 추가
  - `element.__events["click"]` 배열에 `handler` 를 넣어둠
- `removeEvent(element, eventType, handler)`
  - `element.__events["click"]` 배열에서 해당 handler를 제거
- `setupEventListeners(root)`
  - 지금까지 등록된 `registeredEventTypes` 를 보고
  - 각 타입마다 `root.addEventListener(eventType, ...)` 를 한 번씩만 등록
  - 이벤트가 발생하면:
    - `event.target`(실제 클릭된 요소)부터 시작해 `root`까지 부모로 올라가며
    - `element.__events[eventType]` 이 있으면 거기에 있는 handler들을 전부 실행

요약하면:

> 여러 요소의 onClick들을 **루트 하나의 리스너로 처리**하면서,  
> 각 요소에 어떤 함수들이 달렸는지 `__events` 에 모아서 관리하는 구조입니다.

---

## 8. `updateAttributes` – DOM 속성/이벤트 바꾸기

파일: `src/lib/updateElement.js` 안의 `updateAttributes` 함수

이 함수는 **이미 만들어진 DOM 요소의 속성과 이벤트를 “이전 상태 → 새 상태”로 바꿔 주는 함수**입니다.

함수 시그니처:

```js
function updateAttributes(target, originNewProps = {}, originOldProps = {}) { ... }
```

- `target` : 실제 DOM 요소 (`<button>`, `<input>` 등)
- `originNewProps` : 새로 적용하고 싶은 props
- `originOldProps` : 이전 렌더에서 쓰이던 props

### 8-1. 1단계 – 더 이상 필요 없는 속성/이벤트 제거

```js
Object.keys(originOldProps).forEach((key) => {
  // ...
});
```

- 옛날 props에 있던 key들을 하나씩 보면서,
- **새 props에는 없는 것들**을 찾아서 지웁니다.

예를 들어:

- 이전: `{ className: "red", disabled: true, onClick: fn1 }`
- 새로: `{ className: "blue" }`

이라면,

- `disabled` : 더 이상 없으니 `target.disabled = false`
- `onClick` : 더 이상 없으니 `removeEvent(target, "click", fn1)`
- `className` : 나중 2단계에서 새 값으로 덮어씀

### 8-2. 2단계 – 새 속성/이벤트 적용

```js
Object.entries(originNewProps).forEach(([key, value]) => {
  // ...
});
```

여기서는:

- `children`, `key` 는 DOM 속성이 아니므로 무시
- 이전 값과 새 값이 같으면 굳이 다시 설정하지 않음 (최적화)
- 나머지는 타입에 따라 다르게 처리

처리 규칙:

- `onClick`, `onChange` 같은 **이벤트**
  - 옛날 핸들러가 있으면 `removeEvent` 로 제거
  - 새 핸들러를 `addEvent` 로 등록
- `className`
  - `target.setAttribute("class", value)`
- 체크박스/disabled 등 **boolean 속성**
  - `target.checked = value`
  - `target.disabled = value`
- 그 외 일반 속성
  - `target.setAttribute(key, value)`

---

## 9. `updateElement` – 이전 가상 DOM vs 새로운 가상 DOM 비교해서 실제 DOM 수정하기

파일: `src/lib/updateElement.js` 의 `updateElement` 함수

함수 시그니처:

```js
export function updateElement(parentElement, newNode, oldNode, index = 0) { ... }
```

- `parentElement` : 부모 DOM 요소
- `newNode` : 새 VNode (이번에 렌더링하려는 설계도)
- `oldNode` : 이전 VNode (지난번 렌더 때의 설계도)
- `index` : `parentElement.childNodes` 에서 몇 번째 자식인지

### 9-1. 기본 규칙 네 가지

1. **노드 삭제**
   - `!newNode && oldNode` 인 경우
   - 새 설계도에는 없고, 옛날 설계도에만 있으면 → DOM에서 제거

2. **노드 추가**
   - `newNode && !oldNode` 인 경우
   - 옛날에는 없고, 새로 생긴 노드 → `createElement(newNode)` 해서 DOM에 추가

3. **텍스트 노드 변경**
   - 둘 다 문자열/숫자일 때 값이 다르면 `textContent` 만 바꿈
   - 예: `"사과"` → `"배"`

4. **타입이 달라짐 (`div` → `span` 등)**
   - `newNode.type !== oldNode.type` 이면
   - 통째로 새로 만든 노드로 `replaceChild`

### 9-2. 타입이 같은 경우: “최소 변경”으로 업데이트

타입이 같다면(예: 둘 다 `div`):

1. `const element = parentElement.childNodes[index];`  
   → 실제 DOM 요소를 가져옴
2. `updateAttributes(element, newNode.props || {}, oldNode.props || {});`  
   → 속성과 이벤트들을 새 값으로 맞춤
3. children 비교
   - `newChildren` 와 `oldChildren` 의 길이를 비교
   - 공통 길이까지는 `updateElement` 를 재귀 호출
   - 새 children이 더 길면 → 뒤에 **새 DOM 자식 추가**
   - 옛날 children이 더 길면 → 남는 자식들을 **뒤에서부터 제거**

이렇게 하면:

- 전체를 `innerHTML = ""` 로 갈아엎지 않고
- **바뀐 곳만 최소한으로 수정**할 수 있습니다.

---

## 10. `renderElement` – 실제로 렌더링 시작하기

파일: `src/lib/renderElement.js`

`renderElement(vNode, container)` 의 역할:

1. `normalizeVNode(vNode)` 를 호출해서 **정리된 VNode** 를 만듭니다.
2. `container._vNode` 에 이전에 렌더했던 VNode 가 있었는지 확인합니다.
   - 없으면: **최초 렌더링**
     - `createElement` 로 DOM을 만들고 `container.appendChild`
     - 이때 한 번만 `setupEventListeners(container)` 로 이벤트 위임 설정
   - 있으면: **업데이트 렌더링**
     - `updateElement(container, normalizedVNode, oldVNode)` 호출
3. 마지막에 `container._vNode` 를 현재 VNode 로 저장해 둡니다.

즉, `renderElement` 는:

> “이번에 그리고 싶은 VNode” 와  
> “이전에 그려져 있던 VNode” 를 비교해서  
> **최소한의 DOM 변경으로 화면을 최신 상태로 유지**하는 함수입니다.

---

## 11. 마무리 요약

- **`createVNode`** : JSX/컴포넌트 호출 → VNode 설계도 만들기
- **`normalizeVNode`** : 여러 형태의 입력을 렌더링하기 좋은 깔끔한 VNode 로 정리
- **`createElement`** : VNode 설계도 → 진짜 DOM 요소 만들기
- **`eventManager`** : onClick 같은 이벤트를 루트에서 한 번에 관리
- **`updateAttributes`** : 이전 props 와 새 props 를 비교해서 DOM 속성/이벤트 수정
- **`updateElement`** : 이전 VNode vs 새 VNode 를 비교해서 실제 DOM을 최소 변경
- **`renderElement`** : 전체 렌더링 흐름을 관리 (최초 렌더 / 업데이트 렌더)

이 구조를 이해하면, **React 같은 라이브러리가 내부에서 어떤 식으로 동작하는지** 감을 잡을 수 있습니다.  
필요하다면 예제 컴포넌트를 하나 잡고, `console.log` 를 추가해서  
각 단계에서 어떤 값이 들어오고 나가는지 따라가 보는 것도 좋은 연습입니다.

---

## 12. 왜 처음부터 이렇게 안 짰을까? (리팩터링 이야기)

여기까지 보고 나면 이런 생각이 들 수 있습니다.

> “야… 그럼 왜 애초에 이렇게 깔끔하게 안 짰어?”  
> “맨 처음 코드도 이렇게 쓰면 되잖아?”

충분히 나올 수 있는 질문이라,  
**“현실에서 코드가 어떻게 발전하는지”** 도 같이 설명해 둘게요.

### 12-1. 처음 버전 = 연필로 그린 초안

그림을 그릴 때를 떠올려 봅시다.

- 처음에는 연필로 **대충 구조**를 그립니다.
  - 머리 어디, 몸 어디, 팔·다리 어디…
- 이때는 **선이 지저분해도 상관없습니다.**
  - “일단 사람처럼 보이는지”가 더 중요합니다.
- 나중에 펜으로 깔끔하게 따고, 색칠하면서
  - **불필요한 선**을 지우고
  - **비율**을 맞추고
  - **디테일**을 살립니다.

코드도 똑같습니다.

- 처음 버전:
  - “일단 돌아가게 만드는 것”이 목표
  - 이 함수가 저 책임도 하고, 저 함수도 여기저기 끼어 있는 **지저분한 상태**가 흔합니다.
- 나중 버전:
  - 어디까지가 `normalizeVNode` 책임인지
  - 어디부터가 `createElement` 책임인지
  - 어떤 부분을 `updateElement` 가 맡는 게 좋은지
  - 이런 **경계(boundary)** 가 눈에 들어오기 시작합니다.

그래서:

- **처음부터 완벽하게** 짜는 게 아니라
- **돌아가는 코드 → 이해된 부분을 기준으로 조금씩 정리하는 코드**  
  이런 식으로 발전합니다. 이 과정을 “리팩터링(refactoring)” 이라고 부릅니다.

### 12-2. 왜 `createVNode`, `createElement`, `normalizeVNode` 를 처음부터 지금처럼 안 썼나?

아주 솔직하게 말하면, 이유는 세 가지쯤으로 정리할 수 있습니다.

#### 1) 처음에는 정보가 부족하다

처음 코드 쓸 때는 이런 것들이 **불확실**합니다.

- children 안에 어떤 값들이 실제로 들어오는지
- 함수 컴포넌트가 어디서 실행되는 게 제일 좋은 구조인지
- 어떤 타입 조합에서 버그가 나는지
- 성능이 진짜 문제가 되는 지점이 어딘지

그래서:

- 처음 구현은 **“혹시 이런 케이스도 나오지 않을까?”** 를 많이 고려해서
  - 방어적인 코드
  - 여러 가지를 한 함수에서 처리하는 코드
    가 섞이기 쉽습니다.

지금처럼:

- `createVNode` 는 children만 단순하게 정리
- `normalizeVNode` 는 타입을 정리
- `createElement` 는 “정리된 VNode를 진짜 DOM으로 바꾸는 일만”

이렇게 역할이 예쁘게 나뉘는 건,
**여러 번 실행/디버깅/테스트를 해 보면서** 감이 잡힌 뒤의 모습입니다.

#### 2) 버그와 테스트를 거치며 “경계”가 보인다

처음엔 이런 식으로 생각하기 쉽습니다.

- “children 정리는 여기서도 좀 하고…”
- “함수 컴포넌트 실행도 여기서 그냥 해버릴까?”
- “배열이면 그냥 문자열로 합쳐 버릴까?”

그러다 보면:

- 코드가 한 파일/한 함수에 **너무 많은 역할을 떠안게** 됩니다.
- 나중에 버그가 나면:
  - “이게 normalize 문제야?”
  - “createElement 문제야?”
  - “updateElement 문제야?”
  - **어디서 잘못된 건지 찾기 어렵습니다.**

그래서 리팩터링을 하면서:

- “함수 컴포넌트 실행은 `normalizeVNode` 가 전담하자”
- “DOM 만드는 건 `createElement` 만 하게 하자”
- “비교(diffring)는 `updateElement` 가 하게 하자”

이렇게 **역할 분리를 다시 설계**하게 됩니다.

#### 3) 한 번에 완성형 설계를 뽑는 건 거의 불가능하다

많이 쓰는 라이브러리(예: React, Vue) 도,

- v0.x, v1, v2, v3 … 여러 버전을 지나면서
- 내부 구현이 **계속 바뀌고**,
- 더 빠르고, 더 읽기 좋고, 더 유지보수하기 좋게 리팩터링됩니다.

즉:

- “처음부터 지금 같은 구조로 짰어야지!” →  
  현실적으로는 쉽지 않습니다.
- “일단 동작하는 버전을 만든 다음,  
  이해가 깊어질수록 구조를 다듬어 간다” →  
  이게 실제 개발에서 **가장 흔한 패턴**입니다.

이 프로젝트 코드도 똑같이:

- 처음 버전: 동작에 집중 + 방어적인 코드
- 나중 버전: 책임 분리 + 가독성 + 유지보수성에 집중

이라는 과정을 밟고 있다고 보면 됩니다.

### 12-3. 이걸 왜 알고 있어야 할까?

코딩을 처음 배울 때,

- 유튜브/블로그/교재에 나오는 코드는
  - 이미 누군가가 **수십 번 고치고 정리한 “최종 버전”** 인 경우가 많습니다.
- 그래서 내 코드가
  - 지저분해 보이고
  - 중복이 많고
  - 어디가 책임인지 애매하고
  - 로직이 한 함수에 몰려 있어도
  - **“나만 멍청한가…”** 라는 생각이 들기 쉽습니다.

하지만 실제로는:

- **모든 깔끔한 코드 뒤에는 지저분했던 초안들이 숨어 있습니다.**
- 리팩터링은 “내가 멍청해서 하는 일”이 아니라,
  - “이제 좀 이해가 생겼으니까 더 좋은 구조로 바꿀 수 있게 된 상태”를 의미합니다.

이 문서에 있는 `createVNode`, `normalizeVNode`, `createElement`, `updateElement` 구조도

- “애초에 똑 떨어지게 떠오른 완벽 설계” 라기보다는
- “동작하는 구현 몇 번 거친 다음에,  
  그 중복과 애매함을 걷어내서 남긴 형태” 라고 이해하면 편합니다.

그래서 결론은 딱 하나입니다.

> 처음부터 완벽하게 짜려고 **본인을 갈구지 말기**  
> 일단 돌아가게 만든 다음,  
> 지금 이 프로젝트에서 했던 것처럼 **조금씩 더 예쁘게 정리해 가면 됩니다.**
