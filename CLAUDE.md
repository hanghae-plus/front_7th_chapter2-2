# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language Preference

**IMPORTANT: Always respond in Korean (한글) when working in this repository.**

## MCP Usage Guidelines

**IMPORTANT: Proactively use MCP servers when they can help solve problems more effectively.**

This repository has the following MCP servers installed:

1. **playwright** - Use for browser automation, web scraping, screenshot generation, and E2E test development
   - When user asks about testing UI, debugging browser issues, or automating web interactions
   - When generating or debugging E2E tests in the `/e2e` directory

2. **context7** - Use for fetching up-to-date documentation and code examples for libraries
   - When user asks about specific library usage or API
   - When implementing features with external libraries
   - When encountering deprecated APIs or needing current best practices

3. **sequential-thinking** - Use for breaking down complex problems into structured steps
   - When facing architectural decisions or refactoring tasks
   - When debugging complex issues that require systematic analysis
   - When planning multi-step implementations
   - **IMPORTANT: Use this tool automatically without asking for user permission when the situation calls for it**

**Actively identify opportunities to use these MCP servers without waiting for explicit user requests.** If a question would benefit from MCP capabilities, use the appropriate server to provide better solutions.

## Project Overview

This is a custom virtual DOM implementation for an e-commerce shopping cart application, built without using React or other frameworks. The project implements its own JSX transformation, virtual DOM rendering, state management, and routing system.

## Development Commands

### Running the Application
- `pnpm dev` - Start development server (Vite)
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build

### Testing
- `pnpm test` - Run all unit tests (Vitest)
- `pnpm test:basic` - Run basic tests only
- `pnpm test:advanced` - Run advanced tests only
- `pnpm test:ui` - Open Vitest UI
- `pnpm test:e2e` - Run E2E tests (Playwright)
- `pnpm test:e2e:ui` - Run E2E tests with Playwright UI
- `pnpm test:e2e:report` - Show Playwright test report

### Code Quality
- `pnpm lint:fix` - Fix ESLint issues
- `pnpm prettier:write` - Format code with Prettier

### Requirements
- Node.js >= 22
- pnpm >= 10

## Architecture

### Virtual DOM System (`src/lib/`)

The core rendering system is built from scratch:

1. **JSX Transformation**: JSX is transformed to `createVNode()` calls via Babel configuration in `vite.config.js`:
   ```javascript
   jsxFactory: "createVNode"
   ```

2. **VNode Creation**: `createVNode(type, props, ...children)` creates virtual DOM nodes with structure:
   ```javascript
   { type, props, children }
   ```

3. **Rendering Pipeline**:
   - `normalizeVNode()` - Normalizes VNode structure (handles primitives, nulls, arrays)
   - `createElement()` - Creates real DOM elements from VNodes
   - `renderElement()` - Initial render or updates DOM via `updateElement()`
   - `updateElement()` - Diffs and patches DOM efficiently
   - `eventManager.js` - Event delegation system with `addEvent()`, `removeEvent()`, `setupEventListeners()`

### State Management (`src/stores/`)

Redux-style architecture built on custom primitives:

1. **Store System** (`createStore.js`):
   - Creates stores with `{ getState, dispatch, subscribe }`
   - Uses observer pattern (`createObserver.js`) for change notifications
   - Immutable state updates trigger re-renders

2. **Three Main Stores**:
   - `productStore` - Product catalog and search/filter state
   - `cartStore` - Shopping cart items, selection state
   - `uiStore` - UI state (modals, toasts)

3. **Action Types** (`actionTypes.js`):
   - Centralized action type constants
   - Example: `CART_ACTIONS.ADD_ITEM`, `CART_ACTIONS.REMOVE_ITEM`

4. **Storage Persistence** (`src/storage/`):
   - `createStorage()` - Generic localStorage wrapper
   - `cartStorage` - Persists cart state across sessions

### Routing (`src/lib/Router.js`, `src/router/`)

Custom SPA router implementation:

- Pattern matching with dynamic params (`/product/:id`)
- Query parameter parsing/serialization
- History API integration
- Link handling via `data-link` attributes
- Observer pattern for route change notifications
- `withLifecycle()` wrapper adds lifecycle hooks to page components

### Data Layer

1. **API Layer** (`src/api/`):
   - `productApi.js` - Fetch functions for product data

2. **Service Layer** (`src/services/`):
   - Business logic abstracting stores and API
   - `productService.js` - Product fetching and filtering
   - `cartService.js` - Cart operations, persistence

3. **Mock Service Worker** (`src/mocks/`):
   - MSW handlers for API mocking
   - Simulates product catalog API with filtering, pagination, sorting
   - Automatically started in development mode

### Component Structure (`src/components/`, `src/pages/`)

- **Components**: Reusable UI components (ProductCard, CartModal, etc.)
- **Pages**: Route-level components (HomePage, ProductDetailPage, NotFoundPage)
- All use JSX but rendered via custom virtual DOM system

### Utilities

- `withBatch.js` - Batches multiple updates to prevent excessive re-renders
- `domUtils.js` - DOM manipulation helpers

## Key Implementation Notes

### Stub Functions

Many core library functions in `src/lib/` are currently stubs that return empty objects or have no implementation:
- `createVNode()` - Returns `{}`
- `createElement()` - Empty function
- `updateElement()` - Empty function
- `renderElement()` - Contains comments describing expected behavior

These need to be implemented for the virtual DOM system to work. See tests in `src/__tests__/basic.test.jsx` and `src/__tests__/advanced.test.jsx` for expected behavior.

### Rendering Flow

When stores update:
1. Store dispatches action → reducer returns new state
2. Observer notifies all subscribers
3. `render()` function (in `src/render.jsx`) called
4. `render()` is wrapped with `withBatch()` to prevent redundant renders
5. Gets current page component from router
6. Calls `renderElement()` to update DOM

### Event Handling

Uses event delegation:
- Events attached to root element via `setupEventListeners()`
- Event handlers defined in VNode props (e.g., `onClick`)
- `addEvent()` and `removeEvent()` manage event registry

### JSX in This Project

JSX doesn't use React - it's transformed to `createVNode()` calls. Component functions receive props and return VNodes:

```javascript
const MyComponent = ({ title }) => <div>{title}</div>
// Becomes: createVNode("div", null, title)
```
