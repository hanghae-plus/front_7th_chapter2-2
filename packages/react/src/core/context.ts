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
      // 렌더링 루트 정보를 초기화합니다
      // container: 실제 DOM 컨테이너 요소
      // node: 렌더링할 VNode
      // instance: 이전 렌더링 결과는 null로 초기화 (새로 렌더링 시작)
      this.container = container;
      this.node = node;
      this.instance = null;
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
      // 모든 훅 관련 상태를 초기화합니다
      // state: 각 컴포넌트의 훅 상태 저장소
      // cursor: 각 컴포넌트의 현재 훅 인덱스
      // visited: 현재 렌더 사이클에서 방문한 경로들
      // componentStack: 현재 렌더링 중인 컴포넌트 스택
      this.state.clear();
      this.cursor.clear();
      this.visited.clear();
      this.componentStack = [];
    },

    /**
     * 현재 실행 중인 컴포넌트의 고유 경로를 반환합니다.
     */
    get currentPath() {
      // componentStack의 마지막 요소가 현재 실행 중인 컴포넌트의 경로입니다
      // 스택이 비어있으면 컴포넌트 외부에서 훅을 호출한 것이므로 에러를 발생시킵니다
      if (this.componentStack.length === 0) {
        throw new Error("Hooks can only be called inside a component");
      }
      return this.componentStack[this.componentStack.length - 1];
    },

    /**
     * 현재 컴포넌트에서 다음에 실행될 훅의 인덱스(커서)를 반환합니다.
     */
    get currentCursor() {
      // cursor Map에서 현재 경로의 커서를 가져옵니다
      // 처음 실행되는 컴포넌트는 커서가 없으므로 0을 반환합니다
      const path = this.currentPath;
      return this.cursor.get(path) ?? 0;
    },

    /**
     * 현재 컴포넌트의 훅 상태 배열을 반환합니다.
     */
    get currentHooks() {
      // state Map에서 현재 경로의 훅 상태 배열을 가져옵니다
      // 처음 실행되는 컴포넌트는 훅 배열이 없으므로 빈 배열을 생성하여 저장하고 반환합니다
      const path = this.currentPath;
      if (!this.state.has(path)) {
        this.state.set(path, []);
      }
      return this.state.get(path)!;
    },
  },

  /**
   * useEffect 훅의 실행을 관리하는 큐입니다.
   */
  effects: {
    queue: [],
  },

  /**
   * 렌더링 스케줄러 함수입니다.
   * setup()에서 초기화됩니다.
   */
  scheduleRender: null,
};
