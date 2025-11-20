# Development Workflow

This document outlines the complete development workflow for this project.

## Overview

The development process follows a structured approach from issue creation to final commit, ensuring consistency and quality throughout the development cycle. This workflow is designed for AI-driven development efficiency, enabling Claude Code instances to maintain consistent standards and automated quality assurance.

## Step-by-Step Process

### 1. Issue Creation

**Command Pattern**: `Docs({Issue_Number}): Create {TITLE} Issue`

```bash
# Example
git commit -m "Docs(003): Create calendar component Issue"
```

- Create issue document in `ISSUES/` directory
- Use descriptive title that clearly indicates the work scope
- Include TODO checklist with specific tasks
- Add description of expected changes

### 2. Development

- Create branch: `{type}/{issue-number}/{description}`
- Follow coding standards outlined in CODING_STANDARDS.md
- Write tests alongside implementation
- Maintain file organization principles

### 3. Issue Completion

- Update issue file to mark completed tasks
- Check off all TODO items
- Add any discovered additional work or issues
- Update ETC section with relevant notes

### 4. AI-Driven Code Review Automation

- **Automated Quality Assurance**: Claude Code instances automatically review code against established standards
- **Documentation Generation**: Use `markdowns/review-templates/REVIEW_TEMPLATES.md` for consistent format, save as `/code-reviews/{issue-number}/{commit-name}.md`
- **Comprehensive Analysis**: Include code quality, test coverage, architectural decisions, and performance considerations
- **Continuous Improvement**: Document technical debt and improvement opportunities for future AI instances
- **Standards Compliance**: Automated verification of project coding standards adherence

### 5. Todo Updates

- Update `/todos/path/filename.md` for task tracking
- Maintain project-wide todo list
- Track dependencies between tasks
- Note any blockers or prerequisites

### 6. Atomic Commits

**Commit Philosophy**: Every commit should be the minimum unit of work that represents a complete, logical change.

**Pre-commit Process**:

1. **Diff Analysis**: Always run `git diff` before committing to review exact changes
2. **Scope Verification**: Ensure only related changes are included in each commit
3. **Logical Grouping**: Group related changes together, separate unrelated ones
4. **Incremental Progress**: Each commit should build upon the previous one logically

**Commit Convention**:

```
{Type}({Issue_Number}): {English_Title}

{Korean_Translation}

- Detailed changes in Korean
- List specific modifications
- Include relevant context
```

**Example**:

```
Feat(003): Add calendar month view component

캘린더 월 뷰 컴포넌트 추가

- MonthView 컴포넌트 구현
- 월별 이벤트 표시 기능 추가
- 반응형 디자인 적용
- 단위 테스트 및 통합 테스트 작성
```

**IMPORTANT**: Never add "Generated with Claude Code" or any AI signature to commits.

## Branch Strategy

### Branch Naming

- `feat/{issue-number}/{description}` - New features
- `fix/{issue-number}/{description}` - Bug fixes
- `refactor/{issue-number}/{description}` - Code refactoring
- `test/{issue-number}/{description}` - Test implementations
- `docs/{issue-number}/{description}` - Documentation
- `chore/{issue-number}/{description}` - Maintenance tasks

### Merge Strategy

- Use Squash Merge to `main` branch
- Keep commit history clean and focused
- Include comprehensive commit message with Korean translation

## Quality Gates

### Pre-commit Checks

- ESLint validation
- Prettier formatting
- Test execution (if applicable)

### Code Review Criteria

- Adherence to coding standards
- Test coverage and quality
- Performance considerations
- Security best practices
- Documentation completeness

## File Organization Reminders

- Keep files under 150 lines when possible (test files exempt)
- Document reasons for longer files
- Maintain consistent test file structure
- Use clear, descriptive file paths
- Include bilingual file descriptions
