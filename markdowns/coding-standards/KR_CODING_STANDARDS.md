# 코딩 표준

이 문서는 본 프로젝트의 코딩 표준과 모범 사례를 정의하며, AI 기반 개발 효율성과 일관성을 위해 특별히 설계되었습니다.

## 개요

- **AI 우선 접근**: Claude Code 인스턴스가 일관된 품질을 유지하도록 설계된 표준
- **자동화된 준수**: 자동으로 검증하고 적용할 수 있는 규칙
- **효율성 중심**: 높은 표준을 유지하면서 신속한 개발에 최적화

---

## 네이밍 규칙

### 함수

- **camelCase** 사용
- **동사 + 명사 패턴**으로 명확한 동작 표현
- **축약형 대신 풀네임** 사용

```javascript
// ✅ Good
getDaysInMonth, formatWeek, convertEventToDateRange;

// ❌ Avoid
monthDays, weekFormat, eventToRange;
```

**예시**:
- 🙆🏻‍♂️: `aespaKarina`
- 🙅🏻‍♂️: `aspKrna`

### 변수

- **camelCase** 사용

```javascript
// ✅ Good
const eventList = [];
const selectedDate = '2024-01-01';

// ❌ Avoid
const EventList = [];
const selected_date = '2024-01-01';
```

### 컴포넌트

- 클래스와 팩토리 함수는 **PascalCase**
- 목적을 나타내는 **설명적 이름**

```javascript
// ✅ Good
CalendarHeader, EventForm, ScheduleCard;

// ❌ Avoid
Header, Form, Card;
```

### 상수

- **UPPER_SNAKE_CASE** 사용

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

### 파일 및 폴더

- **폴더명**: kebab-case
- **파일명**: kebab-case 또는 PascalCase (컴포넌트)
  - `date-utils.js` (유틸리티)
  - `EventCard.js` (컴포넌트)
  - `easy.dateUtils.spec.js` (테스트)

---

## Import/Export 표준

### Import 순서

항상 다음 순서를 유지합니다:

1. **외부 라이브러리**
2. **내부 컴포넌트**
3. **유틸리티 함수**
4. **상수**
5. **스타일**

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

### Export 표준

- **default export보다 named export 선호**

```javascript
// ✅ Good - Named exports
export const formatDate = (date) => { ... };
export const getDaysInMonth = (year, month) => { ... };

// ❌ Avoid - Default export
export default function formatDate(date) { ... }
```

- **더 나은 구조를 위한 모듈 레벨 re-export**

```javascript
// date-utils.js
export { fillZero } from './dates/fill-zero.js';
export { formatDate } from './dates/format-date.js';
export { getDaysInMonth } from './dates/get-days-in-month.js';
```

---

## 파일 구조

### 파일 길이

- **목표**: 코드 파일을 주석 포함 **80줄 이하**로 유지
- **예외 처리**: 80줄 초과 시 최상단에 주석으로 이유 설명
- **제외**: 문서 파일(.md, .json)은 제외

### 파일 문서화

- **이중 언어 설명**: 파일 상단에 영어와 한국어로 설명 추가

```javascript
// Calendar component managing the display of week and month views
// 주간 및 월간 뷰 표시를 관리하는 캘린더 컴포넌트

export class Calendar {
  // ...
}
```

---

## JSDoc 표준

### 타입 주석

- **JSDoc으로 타입 힌팅**: 함수 시그니처와 복잡한 객체에 JSDoc 추가

```javascript
/**
 * 이벤트 객체
 * @typedef {Object} Event
 * @property {string} id - 이벤트 고유 ID
 * @property {string} title - 이벤트 제목
 * @property {string} date - 날짜 (YYYY-MM-DD)
 * @property {string} startTime - 시작 시간 (HH:mm)
 * @property {string} endTime - 종료 시간 (HH:mm)
 */

/**
 * 날짜 포맷팅
 * @param {Date|string} date - 포맷할 날짜
 * @param {string} [format='YYYY-MM-DD'] - 날짜 형식
 * @returns {string} 포맷된 날짜 문자열
 */
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  // ...
};
```

---

## 함수 표준

### 함수 길이

- **목표**: 함수당 최대 15-20줄
- **단일 책임**: 각 함수는 하나의 명확한 목적

### 함수 패턴

- **기본값 활용**: 선택적 매개변수에 기본값 제공

```javascript
// ✅ Good
export function fillZero(value, size = 2) {
  return String(value).padStart(size, '0');
}
```

- **불변성 유지**: 원본 데이터 변경 금지, spread operator 활용

```javascript
// ✅ Good - 불변성 보장
getEvents() {
  return [...this.events];
}

updateEvent(id, updates) {
  const index = this.events.findIndex(e => e.id === id);
  this.events[index] = { ...this.events[index], ...updates };
}
```

- **Early Return**: 조건부 로직에서 빠른 반환

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

## 클래스 표준

### Private 필드

- **Private 필드는 `#` 접두사 사용**

```javascript
export class EventStore {
  #events = [];
  #listeners = [];

  constructor(initialEvents = []) {
    this.#events = [...initialEvents];
  }

  // ✅ Getter로 읽기 전용 접근
  get events() {
    return [...this.#events];
  }

  // ✅ Private 메서드
  #notify() {
    this.#listeners.forEach(listener => listener(this.#events));
  }
}
```

### 메서드 패턴

- **명확한 메서드명**: 동작을 정확히 표현
- **일관된 반환**: null 반환으로 명시적 실패 처리

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

## 비동기 패턴

### Async/Await 스타일

- **async/await 선호**: Promise.then() 체이닝 대신 async/await 사용
- **에러 처리**: try-catch로 명확한 에러 처리

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
    throw new Error('이벤트를 불러오는데 실패했습니다.');
  }
};
```

---

## 코드 스타일

### 모던 JavaScript

- **ES6+ 문법**: 화살표 함수, 구조 분해, spread/rest 연산자
- **Template literals**: 문자열 보간
- **Optional chaining**: 안전한 속성 접근

```javascript
// ✅ Good - Modern syntax
export class EventManager {
  getEventTitle(id) {
    return this.findEventById(id)?.title ?? '제목 없음';
  }

  formatEventSummary(event) {
    const { title, date, location = '장소 미정' } = event;
    return `${title} - ${date} @ ${location}`;
  }
}
```

### 상수

- **Object.freeze**: 상수 객체의 불변성 보장

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

## DOM 조작

### 모범 사례

- **DocumentFragment**: 대량 DOM 생성 시 성능 최적화
- **Event delegation**: 동적 요소의 효율적인 이벤트 처리
- **Class-based styling**: 인라인 스타일 대신 클래스 사용

```javascript
// ✅ DocumentFragment 활용
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

## 코드 품질

### 커밋 전 요구사항

- **ESLint 검증** 통과 필수
- **Prettier 포맷팅** 적용

### 문서화

- **복잡한 로직**: 접근 방법을 설명하는 주석 추가
- **공개 API**: 공개 함수에 JSDoc 주석

---

## 언어 사용

### 코드 주석

- **코드 주석은 한국어 선호**
- **파일 상단 주석**: 영어 + 한국어 병기

```javascript
// Utility functions for date manipulation
// 날짜 조작을 위한 유틸리티 함수들

/**
 * 월의 일수 계산
 * @param {number} year
 * @param {number} month
 * @returns {number}
 */
export const getDaysInMonth = (year, month) => {
  // 다음 달 0일 = 이번 달 마지막 날
  return new Date(year, month + 1, 0).getDate();
};
```

### 커밋 메시지

- **영어 제목**과 한국어 본문

```
feat: Add event filtering by category

- 카테고리별 이벤트 필터링 기능 추가
- filterEventsByCategory 함수 구현
```

---

## AI 효율성

- **일관된 패턴**: AI가 코드베이스를 효율적으로 이해하고 확장 가능
- **명확한 문서화**: 포괄적인 문서를 통한 컨텍스트 유지
- **자동 검증**: 자동 준수 검사를 위해 설계된 표준
