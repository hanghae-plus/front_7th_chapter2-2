## Description
createVNode 함수 구현 - 가상 DOM 노드 생성 기초 함수

JSX를 가상 DOM 객체로 변환하기 위한 createVNode 함수를 구현합니다.

## Todo
- [x] createVNode 함수 기본 구조 작성
- [x] type, props, children 매개변수 처리
- [x] { type, props, children } 객체 반환 로직 구현
- [x] 자식 배열 평탄화 처리 (테스트 요구사항)
- [x] falsy 값(null, undefined, false) 필터링 처리
- [x] 모든 테스트 케이스 통과 (13/13)

## ETC
- 함수 위치: src/lib/ (테스트에서 import)
- JSX 변환을 위한 기본 구조 설정
- vite.config.js의 jsxFactory: "createVNode" 연동
- 기존 테스트 케이스: src/__tests__/basic.test.jsx