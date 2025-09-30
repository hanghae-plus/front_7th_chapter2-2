import { Context } from "./types";

export const context: Context = {
  root: {
    container: null,
    node: null,
    instance: null,
    reset({ container, node }) {
      this.container = container;
      this.node = node;
      this.instance = null;
    },
  },
  hooks: {
    state: new Map(),
    cursor: new Map(),
    visited: new Set(),
    componentStack: [],
    clear() {
      this.state.clear();
      this.cursor.clear();
      this.visited.clear();
      this.componentStack.length = 0;
    },
    get currentPath() {
      const value = this.componentStack[this.componentStack.length - 1];
      if (value === undefined) {
        throw new Error("hook must be called inside a MiniReact component.");
      }
      return value;
    },
    get currentCursor() {
      return this.cursor.get(this.currentPath) ?? 0;
    },
    get currentHooks() {
      return this.state.get(this.currentPath) ?? [];
    },
  },
  effects: {
    queue: [],
  },
};
