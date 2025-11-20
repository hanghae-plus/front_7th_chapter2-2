# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Developer Persona

Development follows `.claude/DEVELOPER.md` persona (Wang Hao):
- Full-Stack Developer specializing in modern Vanilla JavaScript
- Understand requirements before coding
- Plan atomic commits with clear git diff review
- Test continuously alongside implementation
- Refactor iteratively for code quality

Code reviews follow `.claude/REVIEWER.md` persona (Katarina Yu):
- Senior Code Review Specialist & Quality Assurance Lead
- Multi-layered review process (structure, logic, performance, security, maintainability)
- Reviews saved to `/code-reviews/{issue-number}/{commit-name}.md`

## Project Overview

This is a Vanilla JavaScript web application built with Vite. The project emphasizes AI-driven development with strict coding standards and structured workflows.

## Key Commands

### Development
```bash
npm run dev              # Start dev server (default port 5173)
npm run dev:hash        # Start dev server with hash routing
npm run build           # Build for production
npm run preview         # Preview production build
```

### Code Quality
```bash
npm run lint:fix        # Run ESLint with auto-fix
npm run prettier:write  # Format code with Prettier
```

### Testing
```bash
npm run test:e2e           # Run all E2E tests
npm run test:e2e:basic     # Run basic E2E tests
npm run test:e2e:advanced  # Run advanced E2E tests
npm run test:e2e:ui        # Open Playwright UI
npm run test:e2e:report    # View test report
npm run test:generate      # Generate tests with Playwright codegen
```

Note: Vitest unit tests are configured but E2E tests use Playwright.

## Architecture & Structure

### Testing Architecture
- **Unit Tests**: Vitest with jsdom environment, global test utilities
- **E2E Tests**: Playwright (excluded from Vitest config)
- **Mocking**: MSW (Mock Service Worker) for API mocking
- **Test Setup**: `src/setupTests.js` provides global test configuration

### API Layer
- API functions in `src/api/`
- MSW handlers in `src/mocks/` for development and testing
- Service worker configured in `public/` directory

### Build Configuration
- Uses `rolldown-vite` (Vite with Rolldown bundler)
- ES module format (`"type": "module"`)
- Vitest runs in single-thread mode for consistency

## Development Workflow

### Quick Reference
- **Issues**: `ISSUES/{number}-{TYPE}-{description}.md` format
- **Branches**: `{type}/{issue-number}/{description}`
- **Commits**: `Type(issue-number): English title` + Korean body
- **Reviews**: Use `markdowns/review-templates/REVIEW_TEMPLATES.md`

### Detailed Guidelines
- **Full Workflow**: See `markdowns/dev-workflows/DEV_WORKFLOWS.md`
- **Korean Guide**: See `markdowns/dev-workflows/KR_DEV_WORKFLOWS.md`

## Coding Standards

**Primary Reference**: `markdowns/coding-standards/CODING_STANDARDS.md`

### Key Principles
- **File Length**: Target 150 lines maximum (document exceptions at file top)
  - **Test files exempt**: E2E and integration test files may exceed this limit
- **Function Length**: 15-20 lines maximum
- **Naming**: camelCase (functions/variables), PascalCase (classes), UPPER_SNAKE_CASE (constants)
- **Exports**: Prefer named exports over default
- **Immutability**: Use spread operators, avoid mutations
- **JSDoc**: Document complex functions and objects
- **Private Fields**: Use `#` prefix for class private members

### Modern JavaScript
- ES6+ features required (arrow functions, destructuring, template literals, optional chaining)
- No `var` - use `const`/`let`
- Async/await preferred over Promise chains

### DOM Manipulation
- Use DocumentFragment for bulk DOM creation
- Implement event delegation for dynamic elements
- Class-based styling (avoid inline styles)

## Project-Specific Standards

### Bilingual Documentation
- File headers: English + Korean
- Commit messages: English title, Korean body
- Code comments: Prefer Korean

## File Structure Templates

### Component File Template
```javascript
// ComponentName.js - Component description
// 컴포넌트 설명

import { someUtility } from '../utils/helpers.js';
import { CONSTANTS } from '../constants/index.js';

/**
 * ComponentName - 간단한 설명
 * @param {Object} props - 프로퍼티 객체
 */
export const ComponentName = (props) => {
  // 구현 로직
};
```

### API File Template
```javascript
// api/userApi.js - User API functions
// 사용자 API 함수들

const BASE_URL = '/api/users';

/**
 * fetchUsers - 사용자 목록 조회
 * @returns {Promise<Array>} 사용자 배열
 */
export const fetchUsers = async () => {
  // API 호출 구현
};
```

### Test File Template
```javascript
// ComponentName.test.js - ComponentName tests
// ComponentName 테스트

import { describe, it, expect } from 'vitest';
import { ComponentName } from './ComponentName.js';

describe('ComponentName', () => {
  it('should render correctly', () => {
    // 테스트 구현
  });
});
```

## Important Notes

- **Never add AI signatures** to commits (no "Generated with Claude Code")
- **Always run `git diff`** before committing to review changes
- **Korean language preferred** for detailed commit bodies and code comments
- **English required** for commit titles and file headers