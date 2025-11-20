# Issue #009: CONFIG - Setup GitHub Pages Deployment

## 📋 Issue Type
- [ ] feat: ✨ 새로운 기능 추가
- [ ] fix: 🐛 버그 수정
- [ ] docs: 📝 문서 작업
- [x] config: ⚙️ 설정 변경
- [ ] style: 💄 스타일링
- [ ] refactor: ♻️ 코드 리팩토링
- [ ] test: ✅ 테스트
- [ ] chore: 🔧 기타 작업

## 🎯 작업 목표
GitHub Pages 배포를 위한 프로젝트 설정 변경

## 📝 작업 내용
- [ ] 404.html 페이지 추가 (SPA 라우팅 지원)
- [ ] package.json MSW 설정 추가
- [ ] mockServiceWorker.js 업데이트
- [ ] BASE_URL 경로 변경 (/hh-week5/)
- [ ] Vite 빌드 설정 base 경로 변경
- [ ] Prettier 설정 파일 추가 (선택사항)

## ✅ 완료 기준
- GitHub Pages 배포 시 정상적으로 라우팅 동작
- MSW가 프로덕션 환경에서도 정상 작동
- 모든 정적 자원이 올바른 경로로 로드됨

## 📌 참고 사항
- 프로덕션 빌드 시 base URL이 `/hh-week5/`로 설정됨
- 404.html은 GitHub Pages SPA 라우팅을 위한 fallback 페이지