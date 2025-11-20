## Description
createElement 함수 구현 - 가상 DOM을 실제 DOM으로 변환하는 함수

정규화된 가상 DOM 노드를 받아서 실제 DOM 요소로 변환하는 createElement 함수를 구현합니다.

## Todo
- [ ] null, undefined, boolean 값을 빈 텍스트 노드로 변환
- [ ] 문자열과 숫자를 텍스트 노드로 변환
- [ ] 배열 입력에 대해 DocumentFragment 생성
- [ ] 함수 컴포넌트 처리 시 에러 발생 처리
- [ ] HTML 요소 생성 및 속성 설정
- [ ] 이벤트 핸들러 등록 (eventManager 연동)
- [ ] children 재귀적 처리로 중첩 구조 지원
- [ ] 모든 테스트 케이스 통과

## ETC
- 함수 위치: src/lib/createElement.js
- normalizeVNode 이후 단계로 실제 DOM 생성
- 이벤트 위임을 위한 addEvent 함수 활용
- 다양한 속성 타입 처리 (className, data-*, boolean 등)