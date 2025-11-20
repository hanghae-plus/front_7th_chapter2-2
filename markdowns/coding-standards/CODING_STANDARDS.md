# Coding Standards

This document defines the coding standards and best practices for this project, specifically designed for AI-driven development efficiency and consistency.

## Overview

- **AI-First Approach**: Standards designed for Claude Code instances to maintain consistent quality
- **Automated Compliance**: Rules that can be automatically verified and enforced
- **Efficiency Focus**: Optimized for rapid development while maintaining high standards

---

## Naming Conventions

### Functions

- **camelCase**
- **Verb + Noun pattern** for clear action expression
- **Use full names** instead of abbreviations

```javascript
// ✅ Good
getDaysInMonth, formatWeek, convertEventToDateRange;

// ❌ Avoid
monthDays, weekFormat, eventToRange;
```

**Example**:
- 🙆🏻‍♂️: `aespaKarina`
- 🙅🏻‍♂️: `aspKrna`

### Variables

- **camelCase**

```javascript
// ✅ Good
const eventList = [];
const selectedDate = '2024-01-01';

// ❌ Avoid
const EventList = [];
const selected_date = '2024-01-01';
```

### Components

- **PascalCase** for classes and factory functions
- **Descriptive names** that indicate purpose

```javascript
// ✅ Good
CalendarHeader, EventForm, ScheduleCard;

// ❌ Avoid
Header, Form, Card;
```

### Constants

- **UPPER_SNAKE_CASE**

```javascript
// ✅ Good
const AESPA_MEMBERS = ['Karina', 'Winter', 'Giselle', 'Ningning'];
const NOTIFICATION_OPTIONS = [
  { value: 1, label: '1분 전' },
  { value: 10, label: '10분 전' }
];

// ❌ Avoid
const aespaMembers = [...];
const notificationOptions = [...];
```

### Files and Folders

- **Folders**: kebab-case
- **Files**: kebab-case or PascalCase (for components)
  - `date-utils.js` (utility)
  - `EventCard.js` (component)
  - `easy.dateUtils.spec.js` (test)

---

## Import/Export Standards

### Import Order

Always maintain this specific order:

1. **External libraries**
2. **Internal components**
3. **Utility functions**
4. **Constants**
5. **Styles**

```javascript
// External libraries
import dayjs from 'dayjs';

// Internal components
import { CalendarHeader } from './components/CalendarHeader.js';

// Utility functions
import { formatDate } from './utils/date-utils.js';

// Constants
import { NOTIFICATION_OPTIONS } from './constants/options.js';

// Styles
import './styles/calendar.css';
```

### Export Standards

- **Prefer named exports** over default exports

```javascript
// ✅ Good - Named exports
export const formatDate = (date) => { ... };
export const getDaysInMonth = (year, month) => { ... };

// ❌ Avoid - Default export
export default function formatDate(date) { ... }
```

- **Module-level re-exports** for better organization

```javascript
// date-utils.js
export { fillZero } from './dates/fill-zero.js';
export { formatDate } from './dates/format-date.js';
export { getDaysInMonth } from './dates/get-days-in-month.js';
```

---

## File Organization

### File Length

- **Target**: Keep code files under **150 lines** including comments
- **Exception handling**: If code exceeds 150 lines, add comment at the top explaining why
- **Test file exemption**: E2E and integration test files may exceed this limit
- **Exemptions**: Documentation files (.md, .json) are exempt

### File Documentation

- **Bilingual descriptions**: Add file description at the top in English and Korean

```javascript
// Calendar component managing the display of week and month views
// 주간 및 월간 뷰 표시를 관리하는 캘린더 컴포넌트

export class Calendar {
  // ...
}
```

---

## JSDoc Standards

### Type Annotations

- **Use JSDoc for type hinting**: Add JSDoc to function signatures and complex objects

```javascript
/**
 * Event object
 * @typedef {Object} Event
 * @property {string} id - Event unique ID
 * @property {string} title - Event title
 * @property {string} date - Date (YYYY-MM-DD)
 * @property {string} startTime - Start time (HH:mm)
 * @property {string} endTime - End time (HH:mm)
 */

/**
 * Format date
 * @param {Date|string} date - Date to format
 * @param {string} [format='YYYY-MM-DD'] - Date format
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  // ...
};
```

---

## Function Standards

### Function Length

- **Target**: 15-20 lines maximum per function
- **Single Responsibility**: Each function should have one clear purpose

### Function Patterns

- **Use default values**: Provide default values for optional parameters

```javascript
// ✅ Good
export function fillZero(value, size = 2) {
  return String(value).padStart(size, '0');
}
```

- **Maintain immutability**: Don't mutate original data, use spread operator

```javascript
// ✅ Good - Immutability
getEvents() {
  return [...this.events];
}

updateEvent(id, updates) {
  const index = this.events.findIndex(e => e.id === id);
  this.events[index] = { ...this.events[index], ...updates };
}
```

- **Early Return**: Quick return in conditional logic

```javascript
// ✅ Good - Early return
function updateEvent(id, updates) {
  const index = this.events.findIndex(e => e.id === id);
  if (index === -1) return null;

  this.events[index] = { ...this.events[index], ...updates };
  return this.events[index];
}
```

---

## Class Standards

### Private Fields

- **`#` prefix for private fields**

```javascript
export class EventStore {
  #events = [];
  #listeners = [];

  constructor(initialEvents = []) {
    this.#events = [...initialEvents];
  }

  // ✅ Getter for read-only access
  get events() {
    return [...this.#events];
  }

  // ✅ Private method
  #notify() {
    this.#listeners.forEach(listener => listener(this.#events));
  }
}
```

### Method Patterns

- **Clear method names**: Express behavior accurately
- **Consistent returns**: Explicit failure handling with null return

```javascript
/**
 * @param {string} id
 * @returns {Event|null}
 */
findEventById(id) {
  return this.#events.find(e => e.id === id) ?? null;
}
```

---

## Async Patterns

### Async/Await Style

- **Prefer async/await**: Use async/await instead of Promise.then() chaining
- **Error handling**: Clear error handling with try-catch

```javascript
// ✅ Good
const fetchEvents = async () => {
  try {
    const response = await fetch('/api/events');
    if (!response.ok) throw new Error('Failed to fetch events');

    const { events } = await response.json();
    return events;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw new Error('Failed to load events');
  }
};
```

---

## Code Style

### Modern JavaScript

- **ES6+ syntax**: Arrow functions, destructuring, spread/rest operators
- **Template literals**: String interpolation
- **Optional chaining**: Safe property access

```javascript
// ✅ Good - Modern syntax
export class EventManager {
  getEventTitle(id) {
    return this.findEventById(id)?.title ?? 'No title';
  }

  formatEventSummary(event) {
    const { title, date, location = 'TBD' } = event;
    return `${title} - ${date} @ ${location}`;
  }
}
```

### Constants

- **Object.freeze**: Ensure immutability of constant objects

```javascript
// ✅ Good
export const REPEAT_TYPES = Object.freeze({
  NONE: 'none',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
});
```

---

## DOM Manipulation

### Best Practices

- **DocumentFragment**: Performance optimization for bulk DOM creation
- **Event delegation**: Efficient event handling for dynamic elements
- **Class-based styling**: Use classes instead of inline styles

```javascript
// ✅ DocumentFragment
renderEvents(events) {
  const fragment = document.createDocumentFragment();
  events.forEach(event => {
    fragment.appendChild(createEventCard(event));
  });
  this.container.appendChild(fragment);
}

// ✅ Event delegation
attachEventListeners() {
  this.container.addEventListener('click', (e) => {
    if (e.target.matches('.event-card')) {
      this.handleEventClick(e.target.dataset.eventId);
    }
  });
}

// ✅ Class-based styling
highlightDate(date) {
  this.container.querySelectorAll('.calendar__date--selected')
    .forEach(el => el.classList.remove('calendar__date--selected'));

  const dateEl = this.container.querySelector(`[data-date="${date}"]`);
  dateEl?.classList.add('calendar__date--selected');
}
```

---

## Code Quality

### Pre-commit Requirements

- **ESLint validation** must pass
- **Prettier formatting** applied

### Documentation

- **Complex logic**: Add comments explaining the approach
- **Public APIs**: JSDoc comments for public functions

---

## Language Usage

### Code Comments

- **Prefer Korean** for code comments
- **File header**: Bilingual (English + Korean)

```javascript
// Utility functions for date manipulation
// 날짜 조작을 위한 유틸리티 함수들

/**
 * Calculate days in month
 * @param {number} year
 * @param {number} month
 * @returns {number}
 */
export const getDaysInMonth = (year, month) => {
  // Day 0 of next month = last day of current month
  return new Date(year, month + 1, 0).getDate();
};
```

### Commit Messages

- **English titles** with Korean body text

```
feat: Add event filtering by category

- 카테고리별 이벤트 필터링 기능 추가
- filterEventsByCategory 함수 구현
```

---

## AI Efficiency

- **Consistent patterns**: Enable AI to understand and extend codebase efficiently
- **Clear documentation**: Maintain context through comprehensive docs
- **Automated verification**: Standards designed for automatic compliance
