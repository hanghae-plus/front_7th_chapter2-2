# Claude Code Review Template

AI-driven code review template for consistent quality assurance and documentation.

---

## 📋 Review Summary

**Commit**: `{commit-hash}` - `{commit-title}`
**Issue**: `#{issue-number}`
**Review Date**: `{YYYY-MM-DD}`
**Files Changed**: `{number}` files

### Overall Assessment

- **Quality Score**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Code Standards Compliance**: ✅ Pass / ❌ Issues Found
- **Ready for Merge**: ✅ Yes / ❌ Needs Changes

---

## 🔍 Detailed Analysis

### 1. Code Quality

#### ✅ Strengths

- [ ] Clear and descriptive function/variable names
- [ ] Proper TypeScript usage with strict types
- [ ] Good separation of concerns
- [ ] Effective error handling
- [ ] Performance considerations

#### ⚠️ Areas for Improvement

- [ ] Function length (target: 15-20 lines)
- [ ] File length (target: 150 lines including comments for code files: .ts, .tsx, .js, .jsx; excludes documentation and test files)
- [ ] Code complexity reduction
- [ ] Better naming conventions
- [ ] Missing error handling
- [ ] Performance optimizations needed

### 2. Architecture & Design

#### ✅ Good Practices

- [ ] Follows established patterns
- [ ] Proper component structure
- [ ] Effective state management
- [ ] Good abstraction levels

#### ⚠️ Design Concerns

- [ ] Architectural inconsistencies
- [ ] Tight coupling issues
- [ ] Missing abstractions
- [ ] Scalability concerns

### 3. Standards Compliance

#### File Organization

- [ ] ✅ Under 150 lines (code files) or documented reason
- [ ] ✅ Proper file naming conventions
- [ ] ✅ Correct directory structure
- [ ] ✅ Props in separate type files (`src/types/`)

#### Import/Export Standards

- [ ] ✅ Correct import order (React → External → Internal → Types → Utils)
- [ ] ✅ Named exports used
- [ ] ✅ Path aliases (`@/*`) utilized

#### Naming Conventions

- [ ] ✅ Functions: verb + noun pattern
- [ ] ✅ Components: PascalCase with clear functionality
- [ ] ✅ Constants: UPPER_SNAKE_CASE
- [ ] ✅ Folders: kebab-case

### 4. Testing Coverage

#### Test Quality

- [ ] ✅ Adequate test coverage
- [ ] ✅ Meaningful test descriptions
- [ ] ✅ Edge cases covered
- [ ] ✅ Integration tests included

#### Missing Tests

- [ ] Unit tests for new functions
- [ ] Integration tests for components
- [ ] Error handling scenarios
- [ ] Edge case validations

---

## 🚨 Critical Issues

### Security Concerns

- [ ] No sensitive data exposure
- [ ] Input validation present
- [ ] XSS prevention measures
- [ ] CSRF protection

### Performance Issues

- [ ] No unnecessary re-renders
- [ ] Efficient algorithms used
- [ ] Memory leak prevention
- [ ] Bundle size considerations

---

## 💡 Recommendations

### Immediate Actions Required

1. **High Priority**:

   - [ ] Fix critical security issues
   - [ ] Resolve breaking changes
   - [ ] Address performance bottlenecks

2. **Medium Priority**:

   - [ ] Improve code documentation
   - [ ] Add missing tests
   - [ ] Refactor complex functions

3. **Low Priority**:
   - [ ] Optimize imports
   - [ ] Improve naming consistency
   - [ ] Add JSDoc comments

### Future Improvements

- **Technical Debt**: Document any technical debt introduced
- **Refactoring Opportunities**: Note areas for future refactoring
- **Architecture Evolution**: Suggest architectural improvements

---

## 📊 Metrics

### Code Complexity

- **Cyclomatic Complexity**: `{score}/10`
- **Function Count**: `{count}`
- **Average Function Length**: `{lines}` lines
- **Type Safety Score**: `{percentage}%`

### Test Metrics

- **Coverage Percentage**: `{percentage}%`
- **Test Count**: `{count}` tests
- **Test Types**: Unit (`{count}`), Integration (`{count}`)

---

## 🎯 Action Items

### For Developer

- [ ] **Action 1**: Description of required change
- [ ] **Action 2**: Description of required change
- [ ] **Action 3**: Description of required change

### For Future Reviews

- [ ] Monitor performance after changes
- [ ] Verify test coverage improvements
- [ ] Check for regression issues

---

## 📝 Additional Notes

### Context

- **Related Issues**: Links to related issues or PRs
- **Dependencies**: Any dependencies or blockers
- **Breaking Changes**: Note any breaking changes

### Learning Opportunities

- **Best Practices Applied**: Highlight good practices demonstrated
- **Knowledge Sharing**: Areas where team can learn from this code

---

## ✅ Final Verdict

**Decision**:

- [ ] ✅ **APPROVE** - Ready for merge
- [ ] 🔄 **REQUEST CHANGES** - Needs modifications before merge
- [ ] ❌ **REJECT** - Significant issues require major rework

**Reasoning**: Brief explanation of the decision

**Next Steps**: What should happen next

---

_Review completed by Claude Code AI Assistant_
