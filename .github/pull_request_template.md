## 과제 체크포인트
### 배포 링크

<!--
배포 링크를 적어주세요
예시: https://<username>.github.io/front-7th-chapter2-2/

배포가 완료되지 않으면 과제를 통과할 수 없습니다.
배포 후에 정상 작동하는지 확인해주세요.
-->

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

## 과제 셀프회고

### 트러블슈팅
- `createElement.js` 파일의 `updateAttributes` 함수 작성 시 null 체크 하는 부분에서 true도 제거되는 문제가 있었습니다. 리액트는 boolean type을 렌더링 하지 않는다고 알고 있어서 ... 조건에 무조건 추가해줘야 하는줄 알았습니다.
```javascript
if (value === undefined || value === null || typeof value === "boolean") {
  $el.removeAttribute(...);   // ← true도 여기서 제거됨
  if (key in $el) $el[key] = typeof $el[key] === "boolean" ? false : "";
  return;
}
```
이미 `createElement` 함수에서 체크 후 빈 텍스트 노드로 변환하기 때문에 속성값은 boolean type이더라도 분기에서 채크 후 속성값에 추가해줘야했습니다.
```javascript
if (typeof value === "boolean") {
  // boolean type 속성일 때 추가해줘야함
  $el[key] = value;
  value ? $el.setAttribute(key, "") : $el.removeAttribute(key);
  return;
}
```
- `updateElement.js` 작성시 `updateAttributes` 함수에서 props 체크 후 처리하는 부분이 분기처리가 잘 안되고 e2e테스트에서 계속 오류가 나서 ai한테 리팩토링을 맡김ㅋ
전역변수로 처리하지 말아야 하는 키값과 특정 attribute값을 빼두고 분기 처리 하니 제대로 동작했습니다.
```javascript
const SHOULD_SKIP_ATTR = new Set(["children", "key"]); // dom으로 보내지 말아야 하는 속성
function updateAttributes(target, originNewProps, originOldProps) {
  const newProps = originNewProps ?? {};
  const oldProps = originOldProps ?? {};
  // 모든 key를 가져와서 비교
  const keys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);

  keys.forEach((key) => {
    if (SHOULD_SKIP_ATTR.has(key)) return;
    ...
  }
}

```

### render 정리
1. renderElement에서 normalizeVNode를 통해 vNode를 정규화한다.
2. createElement를 통해 vNode를 실제 DOM으로 만든다.
  - 이때 최초 렌더링 시 addEvent가 호출되어 이벤트가 등록된다.
3. container에 추가한다.
4. setupEventListeners를 통해 이벤트를 등록한다.

### 아하! 모먼트 (A-ha! Moment)
<!--
과제를 진행하며 "아!" 하고 깨달음을 얻었던 순간이 있다면 공유해주세요.
어떤 부분에서 어려움을 겪다가, 어떤 계기로 개념이 명확해졌나요?
-->

### 기술적 성장
<!-- 예시
- 새로 학습한 개념
- 기존 지식의 재발견/심화
- 구현 과정에서의 기술적 도전과 해결
-->

### 코드 품질
<!-- 예시
- 특히 만족스러운 구현
- 리팩토링이 필요한 부분
- 코드 설계 관련 고민과 결정
-->

### 학습 효과 분석
<!-- 예시
- 가장 큰 배움이 있었던 부분
- 추가 학습이 필요한 영역
- 실무 적용 가능성
-->

### 과제 피드백
<!-- 예시
- 과제에서 모호하거나 애매했던 부분
- 과제에서 좋았던 부분
-->

## 리뷰 받고 싶은 내용

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
