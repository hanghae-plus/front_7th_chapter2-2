import type { HookType, NodeType } from "./constants";

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

export interface EffectHook {
  kind: HookType["EFFECT"];
  deps: unknown[] | null;
  cleanup: (() => void) | null;
  effect: () => (() => void) | void;
}

export interface RootContext {
  container: HTMLElement | null;
  node: VNode | null;
  instance: Instance | null;

  reset(options: { container: HTMLElement; node: VNode }): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type State = any;

export interface HooksContext {
  state: Map<string, State[]>;
  effect: Map<string, Array<EffectHook>>;
  cursor: Map<string, number>;
  effectCursor: Map<string, number>;
  visited: Set<string>;
  componentStack: string[];

  unmountQueue: Array<() => void>;

  clear(): void;

  readonly currentPath: string;
  readonly currentCursor: number;
  readonly currentEffectCursor: number;
  readonly currentHooks: State[];
  readonly currentEffects: Array<EffectHook>;
}

export interface EffectsContext {
  queue: Array<{ path: string; cursor: number; effect: EffectHook }>;
  clear(): void;
}

export interface DomEffectsContext {
  queue: Array<DomEffect>;
  push(domEffect: DomEffect): void;
  clear(): void;
  commit(): void;
}

export type DomEffect =
  | { type: "INSERT"; instance: Instance; parentDOM: HTMLElement; anchor?: Node | null }
  | { type: "REMOVE"; instance: Instance | null; parentDOM: HTMLElement }
  | { type: "UPDATE_PROPS"; dom: HTMLElement; prevProps: Props; nextProps: Props }
  | { type: "UPDATE_TEXT"; dom: Text; prevText: string; nextText: string };

export interface Context {
  root: RootContext;
  hooks: HooksContext;
  effects: EffectsContext;
  domEffects: DomEffectsContext;
}

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
