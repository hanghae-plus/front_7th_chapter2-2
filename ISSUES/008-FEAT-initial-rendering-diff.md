# FEAT: Implement Initial Rendering and Basic Diff

## 📋 Description
초기 렌더링과 기본 diff 알고리즘을 구현하여 변경된 부분만 업데이트합니다.

## 🎯 Tasks
- [ ] updateElement 함수 기본 구조 구현
- [ ] 초기 렌더링 처리 (oldNode가 없는 경우)
- [ ] 텍스트 콘텐츠 변경 감지 및 업데이트
- [ ] updateAttributes 함수로 속성 변경 처리
- [ ] 자식 요소 재귀적 업데이트
- [ ] renderElement 함수와 통합

## 📝 Note
### 테스트 대상
- "초기 렌더링이 올바르게 수행되어야 한다"
- "diff 알고리즘을 통해 변경된 부분만 업데이트해야 한다"

### 핵심 기능
- 기존 DOM 요소를 최대한 재사용
- 텍스트만 변경된 경우 textContent만 업데이트
- 속성만 변경된 경우 setAttribute/removeAttribute 사용

## 🔗 Related Files
- `src/lib/updateElement.js` (구현 대상)
- `src/lib/renderElement.js` (updateElement 호출)