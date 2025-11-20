# 개발 워크플로우

이 문서는 본 프로젝트의 전체 개발 워크플로우를 설명합니다.

## 개요

개발 프로세스는 이슈 생성부터 최종 커밋까지 구조화된 접근 방식을 따라 개발 사이클 전반에 걸쳐 일관성과 품질을 보장합니다. 이 워크플로우는 AI 기반 개발 효율성을 위해 설계되어 Claude Code 인스턴스가 일관된 표준과 자동화된 품질 보증을 유지할 수 있도록 합니다.

## 단계별 프로세스

### 1. 이슈 생성

**커맨드 패턴**: `Docs({Issue_Number}): Create {TITLE} Issue`

```bash
# 예시
git commit -m "Docs(003): Create calendar component Issue"
```

- `ISSUES/` 디렉토리에 이슈 문서 생성
- 작업 범위를 명확히 나타내는 설명적 제목 사용
- 구체적인 작업이 포함된 TODO 체크리스트 포함
- 예상 변경사항에 대한 설명 추가

### 2. 개발

- 브랜치 생성: `{type}/{issue-number}/{description}`
- CODING_STANDARDS.md에 명시된 코딩 표준 준수
- 구현과 함께 테스트 작성
- 파일 구조 원칙 유지

### 3. 이슈 완료

- 완료된 작업 표시를 위한 이슈 파일 업데이트
- 모든 TODO 항목 체크
- 발견된 추가 작업이나 이슈 추가
- 관련 메모로 ETC 섹션 업데이트

### 4. AI 기반 코드 리뷰 자동화

- **자동화된 품질 보증**: Claude Code 인스턴스가 설정된 표준에 따라 코드를 자동 검토
- **문서 자동 생성**: `markdowns/review-templates/REVIEW_TEMPLATES.md` 템플릿 사용, `/code-reviews/{issue-number}/{commit-name}.md`로 저장
- **종합적 분석**: 코드 품질, 테스트 커버리지, 아키텍처 결정, 성능 고려사항 포함
- **지속적 개선**: 향후 AI 인스턴스를 위한 기술 부채 및 개선 기회 문서화
- **표준 준수**: 프로젝트 코딩 표준 준수 자동 검증

### 5. 할일 업데이트

- 작업 추적을 위한 `/todos/path/filename.md` 업데이트
- 프로젝트 전체 할일 목록 유지
- 작업 간 종속성 추적
- 블로커나 전제 조건 기록

### 6. 원자적 커밋

**커밋 철학**: 모든 커밋은 완전하고 논리적인 변경을 나타내는 최소 작업 단위여야 합니다.

**Pre-commit 프로세스**:

1. **Diff 분석**: 커밋 전 항상 `git diff`를 실행하여 정확한 변경사항 검토
2. **범위 확인**: 각 커밋에 관련된 변경사항만 포함되었는지 확인
3. **논리적 그룹핑**: 관련된 변경사항은 함께, 관련없는 것은 분리
4. **점진적 진행**: 각 커밋은 이전 커밋을 논리적으로 발전시켜야 함

**커밋 규칙**:

```
{Type}({Issue_Number}): {English_Title}

{Korean_Translation}

- 한국어로 상세한 변경사항 작성
- 구체적인 수정사항 나열
- 관련 컨텍스트 포함
```

**예시**:

```
Feat(003): Add calendar month view component

캘린더 월 뷰 컴포넌트 추가

- MonthView 컴포넌트 구현
- 월별 이벤트 표시 기능 추가
- 반응형 디자인 적용
- 단위 테스트 및 통합 테스트 작성
```

**중요**: 커밋에 "Generated with Claude Code" 또는 AI 서명을 절대 추가하지 마세요.

## 브랜치 전략

### 브랜치 네이밍

- `feat/{issue-number}/{description}` - 새로운 기능
- `fix/{issue-number}/{description}` - 버그 수정
- `refactor/{issue-number}/{description}` - 코드 리팩토링
- `test/{issue-number}/{description}` - 테스트 구현
- `docs/{issue-number}/{description}` - 문서화
- `chore/{issue-number}/{description}` - 유지보수 작업

### 머지 전략

- `main` 브랜치로 Squash Merge 사용
- 깔끔하고 집중된 커밋 히스토리 유지
- 한국어 번역이 포함된 포괄적인 커밋 메시지 포함

## 품질 게이트

### 커밋 전 검사

- ESLint 검증
- Prettier 포맷팅
- 테스트 실행 (해당되는 경우)

### 코드 리뷰 기준

- 코딩 표준 준수
- 테스트 커버리지 및 품질
- 성능 고려사항
- 보안 모범 사례
- 문서 완성도

## 파일 구조 알림

- 가능한 파일을 80줄 이하로 유지
- 긴 파일에 대한 이유 문서화
- 일관된 테스트 파일 구조 유지
- 명확하고 설명적인 파일 경로 사용
- 이중 언어 파일 설명 포함
