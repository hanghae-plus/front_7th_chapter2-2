# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a custom React-like shopping mall application built from scratch without using React. It implements a custom virtual DOM, state management, routing, and event handling system. The project uses Vite with custom JSX transformation pointing to a custom `createVNode` function.

## Development Commands

### Core Development
- `pnpm dev` - Start development server (runs on http://localhost:5173)
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build

### Testing
- `pnpm test` - Run all Vitest unit tests in watch mode
- `pnpm test:basic` - Run basic tests only (tests for virtual DOM implementation)
- `pnpm test:advanced` - Run advanced tests only
- `pnpm test:ui` - Open Vitest UI for interactive testing
- `pnpm test:e2e` - Run Playwright e2e tests
- `pnpm test:e2e:ui` - Run Playwright in UI mode
- `pnpm test:e2e:report` - View Playwright test report
- `pnpm test:generate` - Generate Playwright tests via codegen

### Code Quality
- `pnpm lint:fix` - Run ESLint with auto-fix
- `pnpm prettier:write` - Format code with Prettier

### Requirements
- Node.js >= 22
- pnpm >= 10

## Architecture

### Custom Virtual DOM System (src/lib/)

This project implements a React-like virtual DOM from scratch:

- **createVNode**: JSX factory function that creates virtual DOM nodes. All JSX transforms to `createVNode(type, props, ...children)` calls via Vite's esbuild config.
- **renderElement**: Main rendering function that either creates new DOM (initial render) or updates existing DOM.
- **updateElement**: Virtual DOM diffing algorithm that efficiently updates only changed parts of the DOM.
- **createElement**: Converts vNodes to actual DOM elements.
- **normalizeVNode**: Normalizes vNode structures (handles fragments, arrays, primitives).
- **eventManager**: Event delegation system with `setupEventListeners`, `addEvent`, and `removeEvent`.

**Note**: Many core library functions (createVNode, renderElement, updateElement, eventManager) may have minimal or stub implementations that need to be completed as part of the assignment.

### State Management (src/stores/)

Redux-style state management using custom `createStore`:

- **createStore**: Factory function that creates a store with `getState()`, `dispatch(action)`, and `subscribe(listener)` methods. Built on top of the observer pattern.
- **createObserver**: Simple pub-sub implementation used by stores and router.
- **Stores**:
  - `cartStore` - Shopping cart state (items, selection)
  - `productStore` - Product data and loading states
  - `uiStore` - UI state (modals, toasts, search)
- **actionTypes**: Centralized action type constants (e.g., `CART_ACTIONS.ADD_ITEM`)

State changes automatically trigger re-renders via subscriptions in `src/render.jsx:initRender()`.

### Routing (src/lib/Router.js, src/router/)

Custom SPA router with:

- **Router class**: Handles route matching with param extraction (e.g., `/product/:id`), query string parsing, and navigation.
- **Global instance**: `router` exported from `src/router/router.js`
- **Route registration**: Routes are registered in `src/render.jsx` and map to page components.
- **Navigation**: Uses `router.push(url)` or data-link attribute for declarative navigation.
- **Base URL**: Configured via `BASE_URL` constant for GitHub Pages deployment.

### Rendering Flow

1. `main.js` initializes the app:
   - Starts MSW (Mock Service Worker) for API mocking
   - Loads cart from localStorage
   - Calls `initRender()` to set up store/router subscriptions
   - Starts the router
2. `render.jsx` handles rendering:
   - `initRender()` subscribes to all stores and router
   - `render()` gets the current page component from router and renders it
   - Uses `withBatch()` utility to batch multiple state updates

### Data Persistence (src/storage/)

- **createStorage**: Factory for localStorage wrappers with get/set/remove methods.
- **cartStorage**: Persists cart state to localStorage.
- Cart automatically saves on state changes via `cartStore` reducer.

### Services Layer (src/services/)

- **productService**: Manages product fetching and state updates.
- **cartService**: Higher-level cart operations (add, remove, update quantities, selection).
- Services dispatch actions to stores and handle side effects.

### API Layer (src/api/)

- **productApi**: Fetch functions for product data.
- Uses MSW in development for mocking (handlers in `src/mocks/`).

### Components (src/components/)

Functional components using JSX that compile to `createVNode` calls:
- Cart components: `CartModal`, `CartItem`
- Product components: `ProductCard`, `ProductList`, `ProductDetail`
- UI components: `SearchBar`, `Toast`, `ErrorContent`, `Logo`, `Footer`
- All use `/** @jsx createVNode */` pragma at the top

### Pages (src/pages/)

- `HomePage` - Product listing page
- `ProductDetailPage` - Individual product details (route: `/product/:id`)
- `NotFoundPage` - 404 page (catch-all route: `.*`)
- `PageWrapper` - Common layout wrapper

### Utilities (src/utils/)

- **withBatch**: Performance utility that batches multiple renders into a single animation frame.
- **domUtils**: DOM helper functions.

## Custom JSX Configuration

The project uses a custom JSX transformation configured in `vite.config.js`:

```javascript
esbuild: {
  jsx: "transform",
  jsxFactory: "createVNode",
  jsxDev: false,
}
```

This means all JSX like `<div>Hello</div>` compiles to `createVNode("div", null, "Hello")`.

## Testing Strategy

- **Unit tests**: Vitest tests in `src/__tests__/` verify virtual DOM implementation (basic.test.jsx, advanced.test.jsx).
- **E2E tests**: Playwright tests in `e2e/` directory for user flows.
- **Test environment**: jsdom for unit tests, Chromium for e2e.
- **MSW**: Mocks API calls in both development and tests.

## Git Workflow

- Main branch: `main`
- Current branch: `easy`
- Husky pre-commit hooks run lint-staged (Prettier + ESLint) on staged files.

## Deployment

- `pnpm gh-pages` - Build and deploy to GitHub Pages
- Production base URL is `/front_7th_chapter2-2/` (configured in vite.config.js)
