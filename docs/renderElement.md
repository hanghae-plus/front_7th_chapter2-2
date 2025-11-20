## 파일: `src/lib/renderElement.js`

### 1. 이 파일이 하는 일을 한 줄로 말하면

**가상 DOM(VNode)을 받아서, 컨테이너에 “최초 렌더” 또는 “업데이트 렌더”를 수행하는 진입 함수**입니다.  
쉽게 말하면: “지금 그려야 할 화면”과 “이전에 그려놨던 화면”을 비교해서, DOM을 만들어주거나 업데이트해 줍니다.

---

### 2. 코드 흐름, 진짜 쉽게 풀어서 설명

```js
import { setupEventListeners } from "./eventManager";
import { createElement } from "./createElement";
import { normalizeVNode } from "./normalizeVNode";
import { updateElement } from "./updateElement";

// 컨테이너별로 이전 vNode를 저장 (업데이트를 위해)
const containerVNodes = new WeakMap();
```

- `normalizeVNode` : 함수 컴포넌트 실행, 이상한 값 정리 → **깨끗한 VNode** 로 바꿔 줌
- `createElement` : VNode → 실제 DOM 요소 생성
- `updateElement` : 이전 VNode vs 새 VNode 를 비교해서 **필요한 부분만 DOM 수정**
- `setupEventListeners` : 루트 컨테이너 하나에 이벤트 위임 리스너를 설정
- `containerVNodes` : `WeakMap` 을 이용해, 각 컨테이너마다 “이전에 렌더했던 VNode” 를 기억합니다.

#### 2-1. `renderElement(vNode, container)` – 전체 렌더링 함수

```js
export function renderElement(vNode, container) {
  // vNode 정규화 (함수 컴포넌트 실행)
  const normalizedVNode = normalizeVNode(vNode);

  // 이전 vNode 가져오기
  const oldVNode = containerVNodes.get(container);
```

- `vNode` : “이번에 그리고 싶은 화면”의 VNode 설계도
- `normalizedVNode` : 함수 컴포넌트 실행 + 값 정리 후, 렌더링하기 좋은 형태로 정규화된 VNode
- `oldVNode` : 이전에 이 `container` 에 렌더했던 VNode (없으면 최초 렌더)

```js
  if (oldVNode) {
    // 업데이트 모드: 기존 DOM을 업데이트
    updateElement(container, normalizedVNode, oldVNode, 0);
  } else {
    // 초기 렌더링: DOM 생성 및 추가
    // 컨테이너 비우기
    container.innerHTML = "";

    // DOM 생성
    const domElement = createElement(normalizedVNode);

    // DocumentFragment인 경우 자식 노드들을 추가
    if (domElement.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      while (domElement.firstChild) {
        container.appendChild(domElement.firstChild);
      }
    } else {
      container.appendChild(domElement);
    }
  }
```

- **최초 렌더링이 아닌 경우 (`oldVNode` 있음)**:
  - `updateElement(container, normalizedVNode, oldVNode, 0)` 을 호출해서
  - 이전 VNode 와 새 VNode 를 비교(diff)하고,  
    **기존 DOM 안에서 필요한 부분만 수정**합니다.
- **최초 렌더링인 경우 (`oldVNode` 없음)**:
  - `container.innerHTML = ""` 로 컨테이너를 비운 뒤,
  - `createElement(normalizedVNode)` 로 전체 DOM 트리를 새로 만들고,
  - `DocumentFragment` 인 경우에는 자식 노드들을 하나씩 꺼내 `appendChild`,
  - 아니면 DOM 요소 하나를 그대로 `appendChild` 합니다.

```js
  // 이벤트 위임 설정 (한 번만 설정)
  setupEventListeners(container);

  // 현재 vNode 저장 (다음 업데이트를 위해)
  containerVNodes.set(container, normalizedVNode);
}
```

- `setupEventListeners(container)`:
  - 루트 컨테이너에 이벤트 위임 리스너를 설정합니다.
  - `eventManager` 안에서 `rootListeners` 로 한 번만 등록되도록 막고 있으므로,
    - `renderElement` 가 여러 번 호출돼도 **리스너가 중복 등록되지 않습니다.**
- `containerVNodes.set(container, normalizedVNode)`:
  - 다음에 `renderElement` 가 호출될 때,
  - 이 VNode 를 `oldVNode` 로 사용해서 업데이트 렌더를 수행할 수 있게 저장해 둡니다.

요약하면:

- `renderElement` 는
  - 처음에는 전체 DOM 을 생성해서 붙이고,
  - 그 이후에는 이전/현재 VNode 를 기억해 두었다가  
    **변경된 부분만 업데이트하는 역할**을 합니다.

---

### 3. 리팩터링 아이디어 3가지

#### 아이디어 1) `container._vNode` 를 사용하는 방식으로 단순화

현재는 `containerVNodes` 라는 `WeakMap` 을 사용해,

```js
const oldVNode = containerVNodes.get(container);
// ...
containerVNodes.set(container, normalizedVNode);
```

처럼 이전 VNode 를 저장/조회합니다.

다른 방식으로는:

```js
const oldVNode = container._vNode;
// ...
container._vNode = normalizedVNode;
```

처럼 컨테이너 DOM 요소에 직접 프로퍼티를 붙이는 방법도 있습니다.

- **장점**:
  - 코드가 더 단순해지고, 디버깅 시 DevTools 로 컨테이너를 봤을 때 `_vNode` 를 바로 확인할 수 있습니다.
- **단점**:
  - DOM 요소에 커스텀 프로퍼티를 붙이기 때문에,  
    DOM 을 “외부에서 더럽히지 않는다”는 관점에서는 WeakMap 이 더 깔끔합니다.

#### 아이디어 2) 이벤트 위임 설정을 초기 한 번만 수행하도록 분리

지금은 `renderElement` 가 호출될 때마다 `setupEventListeners(container)` 를 호출하지만,
`eventManager` 안에서 “이미 설정된 root 인지” 체크를 하고 있어서 실제론 한 번만 등록됩니다.

리팩터링 아이디어:

- `initRender` 또는 앱 초기화 단계에서
  - 한 번만 `setupEventListeners(rootElement)` 를 호출하고,
- `renderElement` 에서는 이벤트 설정을 전혀 신경 쓰지 않고 **렌더링만 담당**하게 만들 수 있습니다.

장점:

- `renderElement` 의 책임이 “화면 그리기/업데이트” 에만 집중되고,
- 이벤트 설정은 별도의 초기화 코드에서만 관리할 수 있어 **관심사가 더 분리**됩니다.

#### 아이디어 3) 초기 렌더링 시 `innerHTML = ""` 대신 diff 기반으로만 동작하게 통일

현재는:

- 최초 렌더: `innerHTML = ""` 후, 전체 DOM 을 새로 만들어서 붙임.
- 이후 렌더: `updateElement` 를 써서 diff 기반 업데이트.

리팩터링 아이디어:

- 최초 렌더 시에도 `updateElement` 로만 처리하는 방식으로 통일할 수 있습니다.
  - 예: `oldVNode` 가 `null` 인 상태에서도 `updateElement` 가  
    “없던 노드 → 새 노드 추가” 로직만 타도록 설계.

장점:

- “DOM 비우고 다시 만드는 코드” 없이,  
  모든 렌더 경로가 **하나의 diff 로직**을 타게 되어 일관성이 생깁니다.
- 다만, 현재 구현 규모에선 과한 최적화일 수 있고,  
  유지보수 난이도/가독성과 트레이드오프가 있습니다.


