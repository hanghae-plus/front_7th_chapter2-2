# 회고 파일 작성 가이드

> 커밋 전 반드시 작성하는 개인 회고 문서

## 📁 위치 및 파일명

```
review/
├── 01-useState-구현.md
├── 02-reconcile-자식-비교-문제-해결.md
├── 03-useEffect-cleanup-로직.md
└── ...
```

- **폴더**: `review/`
- **파일명**: `01-한글제목.md`, `02-한글제목.md` (순서대로)
- **커밋 안 함**: `.gitignore`에 포함됨

## ✍️ 작성 시점

**모든 커밋 전에 반드시 작성**

```bash
# 올바른 순서
1. 코드 작성 완료
2. 회고 파일 작성  ← 여기!
3. git add
4. git commit
```

## 📝 작성 내용

### 1. 고민한 내용

```markdown
## 고민한 내용

Q: Hook의 상태를 어떻게 저장할까?
A: Map<path, HookState[]>로 컴포넌트별로 격리

Q: 왜 커서가 필요한가?
A: 같은 컴포넌트에서 여러 Hook 호출 시 순서 추적

Q: Early return vs 중첩 if?
A: Early return 선택 - depth가 낮아서 가독성 좋음
```

### 2. 해결한 문제

```markdown
## 해결한 문제

**문제**: setState 호출 시 무한 루프
**원인**: Object.is 비교 없이 매번 리렌더링
**시도1**: 단순 === 비교 → NaN 문제 발생
**시도2**: Object.is 사용 → 해결!
**교훈**: JavaScript의 특수한 값 비교 이해
```

### 3. AI에게 질문한 내용

```markdown
## AI 질문/답변

Q: reconcile 함수가 너무 길어요. 어떻게 분리하나요?
A: mount/update/unmount 3개 함수로 분리 제안
→ 실제로 적용해보니 가독성 향상!

Q: 자식 배열 비교할 때 key를 어떻게 활용하나요?
A: Map으로 key별 인덱스 저장 후 O(1) 탐색
→ 성능 개선됨
```

### 4. 배운 점

```markdown
## 배운 점

- **클로저**: useState의 상태는 클로저로 캡슐화
- **불변성**: 항상 새 배열/객체 반환해야 함
- **타입 가드**: TypeScript의 type narrowing 활용
- **Early return**: depth를 줄여 가독성 향상
```

### 5. 참고 자료

```markdown
## 참고 자료

- React 공식 문서: Hook 규칙
- docs/06-beginner-execution-guide.md: Phase 6 참고
- MDN: Object.is() vs ===
- 블로그: "React Reconciliation 알고리즘 이해하기"
```

### 6. 다음 개선 사항

```markdown
## 다음에 개선할 점

- [ ] reconcileChildren 함수 30줄로 줄이기
- [ ] 타입 정의를 더 명확하게
- [ ] JSDoc 주석 추가
- [ ] 테스트 케이스 추가
```

## 📋 템플릿

```markdown
# [순서]-[제목].md

## 구현한 내용

[한 줄 요약]

## 고민한 내용

Q:
A:

Q:
A:

## 해결한 문제

**문제**:
**원인**:
**해결**:
**교훈**:

## AI 질문/답변 (있다면)

Q:
A:

## 배운 점

-
-
-

## 참고 자료

-
-

## 다음에 개선할 점

- [ ]
- [ ]
```

## 🎯 목적

### PR 작성 시 활용

회고 파일을 보며 PR 템플릿 작성:

```markdown
## 과제 셀프회고

### 아하! 모먼트

회고 파일 "02-reconcile-자식-비교-문제-해결.md" 참고:
"자식 배열 비교 시 Map을 활용하면 O(n²)이 O(n)으로 개선됨을 깨달았습니다."

### 기술적 성장

회고 파일 "01-useState-구현.md" 참고:
"클로저를 활용한 상태 캡슐화 패턴을 실제로 구현해봤습니다."
```

### 학습 기록

- 나중에 복습할 때 **고민 과정** 확인
- 같은 실수 반복 방지
- 성장 과정 추적

## ⚠️ 주의사항

### 작성하지 않으면

```bash
# 커밋 거부!
git commit -m "feat(hooks): implement useState"
# → Error: review 폴더에 회고 파일을 먼저 작성하세요
```

### 간단한 작업도 작성

```markdown
# 03-타입-정의-추가.md

## 구현한 내용

VNode, Instance 타입 정의

## 고민한 내용

Q: Interface vs Type?
A: Type 선택 - Union 타입 활용 가능

## 배운 점

- TypeScript의 type vs interface 차이
```

### 회고가 없는 커밋은 안 됨

- 단순 오타 수정도 회고 작성
- "배운 점"만이라도 작성

## 💡 팁

### 코딩하면서 메모

```markdown
# 코딩 중 메모 (임시)

- 왜 Map을 사용했는지?
- 이 부분 리팩토링 필요
- 테스트 추가해야 함

↓ 커밋 전 정리

# 회고 파일

## 고민한 내용

Q: 왜 Map을 사용했나요?
A: ...
```

### 작은 단위로 자주

- 1 커밋 = 1 회고 파일
- 너무 많은 내용을 한 파일에 담지 말 것

### AI 대화 기록 활용

- Cursor/Claude 대화 복붙
- 질문과 답변을 구조화

## 📊 예시

실제 회고 파일 예시:

````markdown
# 01-useState-구현-완료.md

## 구현한 내용

useState Hook을 구현했습니다.

- 초기값 설정 (함수형 지원)
- setState로 상태 업데이트
- Object.is로 값 비교
- 변경 시에만 리렌더링

## 고민한 내용

Q: Hook 상태를 어디에 저장할까?
A1: 전역 변수? → 컴포넌트 간 격리 안 됨 ❌
A2: 컴포넌트 인스턴스? → 함수 컴포넌트는 인스턴스 없음 ❌
A3: context.hooks.state Map? → 경로별로 격리 가능 ✅

Q: 커서는 왜 증가시키나?
A: 같은 컴포넌트에서 useState를 여러 번 호출할 때
호출 순서를 추적하기 위해

## 해결한 문제

**문제**: setState를 연속으로 호출하면 무한 루프

```javascript
const [count, setCount] = useState(0);
setCount(1);
setCount(2);
setCount(3); // 무한 루프!
```
````

**원인**: 매번 리렌더링 트리거 → enqueueRender가 계속 호출

**해결**: Object.is로 이전 값과 비교

```typescript
if (!Object.is(hook.value, nextValue)) {
  hook.value = nextValue;
  enqueueRender();
}
```

**교훈**:

- React의 배치 업데이트 원리 이해
- Object.is vs === 차이 (NaN, +0/-0)

## AI 질문/답변

Q: 함수형 초기값은 왜 필요한가요?
A: 계산 비용이 높은 초기값을 lazy하게 초기화하기 위해
useState(() => expensiveCalculation())

Q: setState의 함수형 업데이트는?
A: 이전 값을 기반으로 새 값 계산할 때
setCount(prev => prev + 1)

## 배운 점

- **클로저 활용**: Hook 상태는 클로저로 캡슐화
- **불변성 중요**: 새 값을 반환해야 React가 변경 감지
- **타입 제네릭**: useState<T>로 타입 안전성 확보
- **Object.is**: ===보다 정확한 비교

## 참고 자료

- React 공식 문서: useState
- docs/06-beginner-execution-guide.md: Phase 6.1
- MDN: Object.is()

## 다음에 개선할 점

- [ ] setState 함수에 JSDoc 추가
- [ ] 에러 메시지 더 명확하게
- [ ] 타입 정의를 별도 파일로 분리

```

```
