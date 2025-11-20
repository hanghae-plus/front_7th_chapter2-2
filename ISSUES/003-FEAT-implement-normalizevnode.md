## Description
normalizeVNode 함수 구현 - 가상 DOM 노드 정규화 함수

함수 컴포넌트와 다양한 타입의 값들을 표준화된 형태로 변환하여 createElement에서 처리할 수 있도록 하는 normalizeVNode 함수를 구현합니다.

## Todo
- [ ] null, undefined, boolean 값을 빈 문자열로 변환 처리
- [ ] 문자열과 숫자를 문자열로 변환 처리
- [ ] 함수 컴포넌트 실행 및 재귀적 정규화 처리
- [ ] children을 props에 병합하여 함수 컴포넌트에 전달
- [ ] 일반 vNode의 children 재귀적 정규화
- [ ] falsy 값 필터링으로 빈 문자열 제거
- [ ] 모든 테스트 케이스 통과

## ETC
- 함수 위치: src/lib/normalizeVNode.js
- React-like 컴포넌트 패턴 지원을 위한 핵심 기능
- children props 병합으로 함수형 컴포넌트 동작 구현
- 재귀적 처리로 중첩된 컴포넌트 구조 지원