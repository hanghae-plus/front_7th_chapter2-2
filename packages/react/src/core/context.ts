import { Context } from "./types";

/**
 * Mini-React의 전역 컨텍스트입니다.
 * 렌더링 루트, 훅 상태, 이펙트 큐 등 모든 런타임 데이터를 관리합니다.
 */
export const context: Context = {
  /**
   * 렌더링 루트와 관련된 정보를 관리합니다.
   */
  root: {
    container: null,
    node: null,
    instance: null,
    reset({ container, node }) {
      context.root.container = container;
      context.root.node = node;
      context.root.instance = null;
    },
  },

  /**
   * 훅의 상태를 관리합니다.
   * 컴포넌트 경로(path)를 키로 사용하여 각 컴포넌트의 훅 상태를 격리합니다.
   */
  hooks: {
    state: new Map(),
    cursor: new Map(),
    visited: new Set(),
    componentStack: [],

    /**
     * 모든 훅 관련 상태를 초기화합니다.
     */
    clear() {
      context.hooks.state.clear();
      context.hooks.cursor.clear();
      context.hooks.visited.clear();
      context.hooks.componentStack = [];
    },

    /**
     * 현재 실행 중인 컴포넌트의 고유 경로를 반환합니다.
     */
    get currentPath() {
      const stack = context.hooks.componentStack;
      if (stack.length === 0) {
        throw new Error("Hooks can only be called inside a component");
      }
      return stack[stack.length - 1];
    },

    /**
     * 현재 컴포넌트에서 다음에 실행될 훅의 인덱스(커서)를 반환합니다.
     */
    get currentCursor() {
      const path = context.hooks.currentPath;
      return context.hooks.cursor.get(path) || 0;
    },

    /**
     * 현재 컴포넌트의 훅 상태 배열을 반환합니다.
     */
    get currentHooks() {
      const path = context.hooks.currentPath;
      if (!context.hooks.state.has(path)) {
        context.hooks.state.set(path, []);
      }
      return context.hooks.state.get(path)!;
    },
  },

  /**
   * useEffect 훅의 실행을 관리하는 큐입니다.
   */
  effects: {
    queue: [],
  },
};
