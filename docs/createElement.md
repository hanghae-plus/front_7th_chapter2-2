## 파일: `src/lib/createElement.js`

### 1. 이 파일이 하는 일을 한 줄로 말하면

**“화면 설계도(VNode)” → 진짜 브라우저 DOM 요소** 로 바꿔 주는 함수입니다.  
텍스트/숫자/배열/일반 태그를 구분해서, 그에 맞는 DOM 을 만들어 줍니다.

---

### 2. 코드 흐름, 진짜 쉽게 풀어서 설명

#### 2-1. `createElement(vNode)`

이 함수는 **vNode의 타입에 따라** 다르게 처리합니다.

- 1) `null`, `undefined`, `boolean` 인 경우
  - 어차피 화면에 보이지 않아야 하는 값이므로
  - **빈 텍스트 노드** (`document.createTextNode("")`) 를 만들어서 반환합니다.

- 2) 문자열인 경우
  - `"안녕"` 같은 값이면,
  - `document.createTextNode("안녕")` 으로 텍스트 노드를 만들어 반환합니다.

- 3) 숫자인 경우
  - `123` 같은 값이면,
  - `String(123)` → `"123"` 으로 바꾼 뒤 텍스트 노드를 만들어 반환합니다.

- 4) 배열인 경우
  - 여러 VNode 들이 들어있는 배열이면:
    - `document.createDocumentFragment()` 라는 **보이지 않는 임시 상자**를 만들고,
    - 배열의 각 요소에 대해 `createElement` 를 재귀 호출해서 fragment에 붙입니다.
    - 마지막에 fragment를 반환하면,
      - 나중에 한 번에 DOM에 추가할 수 있어서 효율이 좋아집니다.

- 5) 그 밖의 경우 = “일반 VNode 객체”인 경우
  - `vNode.type` 을 보고 실제 DOM 요소를 만듭니다.
    - 예: `type: "button"` → `document.createElement("button")`
  - `updateAttributes(element, vNode.props || {})` 로
    - 이벤트(onClick 등), className, checked 같은 속성을 한 번에 적용합니다.
  - `vNode.children` 을 순회하면서
    - 각 child에 대해 `createElement(child)` 를 호출하고
    - 만들어진 DOM 을 `element.appendChild(...)` 로 붙입니다.

#### 2-2. `updateAttributes($el, props)`

이 함수는 **props 객체를 보고 실제 DOM 속성/이벤트로 옮겨 적는 역할**을 합니다.

- `children`, `key` 는 DOM 속성이 아니므로 **무시**합니다.
- `onClick`, `onChange` 처럼 `on` 으로 시작하면:
  - `"click"`, `"change"` 처럼 소문자로 바꾼 뒤
  - `addEvent($el, eventType, handler)` 를 호출해서 이벤트를 등록합니다.
- `className` 은 HTML 속성 이름이 아니므로:
  - `class` 로 바꿔서 `setAttribute("class", value)` 를 호출합니다.
- `checked`, `disabled`, `selected`, `readOnly` 같은 boolean 속성은:
  - `setAttribute` 대신 DOM 프로퍼티로 바로 설정합니다.
  - 예: `$el.checked = true`
- 그 외 나머지 속성은:
  - 전부 `setAttribute(key, value)` 로 설정합니다.

요약하면:

- `createElement` 는 “설계도(VNode)”를 해석해서
  - 어떤 태그를 만들지,
  - 어떤 속성을 붙일지,
  - 어떤 자식들을 넣을지 결정하는 **공장**입니다.

---

### 3. 리팩터링 아이디어 3가지

#### 아이디어 1) 스타일(`style`) 객체 지원하기

- 지금은 `props.style` 이 객체인 경우를 처리하지 않습니다.
- React 처럼:

```js
<div style={{ color: "red", fontSize: "14px" }} />
```

를 쓰고 싶다면,

- `updateAttributes` 안에서:
  - `key === "style"` 일 때,
  - `value` 를 객체로 보고 `Object.entries` 를 돌며
  - `$el.style[color] = "red"` 처럼 직접 설정하도록 확장할 수 있습니다.

이건 기능 확장 겸, props 처리 로직을 더 “실제 프레임워크”에 가깝게 만드는 리팩터링입니다.

#### 아이디어 2) 이벤트/일반 속성/boolean 속성 처리를 함수로 분리

- 지금 `updateAttributes` 는 한 함수 안에서:
  - 이벤트
  - className
  - boolean 속성
  - 일반 속성
  를 모두 처리하고 있습니다.
- 이걸 아래처럼 쪼갤 수 있습니다.

```js
function setEventProp($el, key, value) { ... }
function setBooleanProp($el, key, value) { ... }
function setNormalProp($el, key, value) { ... }
```

그리고 `updateAttributes` 에서는:

```js
if (key.startsWith("on")) return setEventProp(...);
if (isBooleanProp(key))   return setBooleanProp(...);
return setNormalProp(...);
```

처럼 호출만 해 줍니다.

- 장점:
  - props 처리 규칙이 복잡해져도 **각 타입별 함수만 보면 이해할 수 있음**
  - 테스트도 타입별로 쪼개서 할 수 있음

#### 아이디어 3) `createElement` 를 “순수 함수”에 가깝게 만들기

- 지금은 `createElement` 가 **DOM을 직접 만드는 함수**입니다.
- 다른 방식으로는:
  - `createElement` 가 “어떤 DOM 작업을 해야 하는지”를
    - 예: `{ type: "CREATE", tag: "div", props: {...}, children: [...] }`
    같은 **명령 객체(command)** 로 반환하게 만들고,
  - 실제로 DOM을 만드는 함수는 별도로 두는 방법도 있습니다.

이렇게 하면:

- 테스트할 때 **진짜 DOM이 없어도** (JSDOM 같은 환경 없이도)
  - “명령 객체”만 보고 로직이 맞는지 검증할 수 있습니다.
- 물론 이건 규모가 커졌을 때 의미 있는 리팩터링이고,
  - 지금처럼 단순한 구현에서는 과할 수 있습니다.


