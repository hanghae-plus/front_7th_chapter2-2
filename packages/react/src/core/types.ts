import type { NodeType } from "./constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = Record<string, any> & { children?: VNode[] };

export interface FunctionComponent<P extends Props> {
  (props: P): VNode | null;
  displayName?: string;
}

export interface VNode {
  type: string | symbol | React.ComponentType;
  key: string | null;
  props: Props;
}

export interface Instance {
  kind: NodeType;
  dom: HTMLElement | Text | null;
  node: VNode;
  children: (Instance | null)[];
  key: string | null;
  path: string;
}

// --- Hooks Types (Single Array Structure) ---

export interface BaseHook {
  tag: string;
}

export interface StateHook<T> extends BaseHook {
  tag: "STATE";
  state: T;
}

export interface EffectHook extends BaseHook {
  tag: "EFFECT";
  path: string;
  deps: unknown[] | null;
  cleanup: (() => void) | null;
  effect: () => (() => void) | void;
}

export type Hook = StateHook<unknown> | EffectHook;

// --- Context Types ---

export interface RootContext {
  container: HTMLElement | null;
  node: VNode | null;
  instance: Instance | null;
}

// Persistent context
export interface StoreContext {
  root: RootContext;
  hooks: Map<string, Hook[]>;
  cleanupEffects: Map<string, (() => void)[]>;
}

// Temporary context for each render
export interface RuntimeContext {
  cursor: {
    path: string | null;
    index: number;
  };
  workQueue: {
    domMutations: DomEffect[];
    passiveEffects: EffectHook[];
    cleanups: (() => void)[];
  };
  componentStack: string[];
  visited: Set<string>;
}

export type DomEffect =
  | { type: "INSERT"; instance: Instance; parentDOM: HTMLElement; anchor?: Node | null }
  | { type: "REMOVE"; instance: Instance | null; parentDOM: HTMLElement }
  | { type: "UPDATE_PROPS"; dom: HTMLElement; prevProps: Props; nextProps: Props }
  | { type: "UPDATE_TEXT"; dom: Text; prevText: string; nextText: string };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace React {
    interface ComponentType<P extends Props = Props> {
      (props: P): VNode | null;
    }
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [elemName: string]: any;
    }

    const Fragment: React.ComponentType;
  }
}
