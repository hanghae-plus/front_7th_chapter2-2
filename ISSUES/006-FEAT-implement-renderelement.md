## Description
renderElement 함수 구현 - 가상 DOM을 실제 DOM으로 렌더링하는 메인 함수

vNode를 받아서 정규화하고, 실제 DOM으로 변환한 후 컨테이너에 렌더링하며 이벤트를 설정하는 renderElement 함수를 구현합니다.

## Todo
- [ ] vNode 정규화 처리 (normalizeVNode 활용)
- [ ] 실제 DOM 생성 (createElement 활용)
- [ ] 기존 컨테이너 내용 제거 후 새 DOM 추가
- [ ] 이벤트 위임 설정 (setupEventListeners 활용)
- [ ] 초기 렌더링과 업데이트 렌더링 지원
- [ ] 컨테이너 유효성 검증
- [ ] 렌더링 완료 후 이벤트 시스템 활성화
- [ ] 모든 테스트 케이스 통과

## ETC
- 함수 위치: src/lib/renderElement.js
- normalizeVNode, createElement, setupEventListeners 통합
- React의 render 함수와 유사한 역할
- 전체 렌더링 파이프라인의 진입점