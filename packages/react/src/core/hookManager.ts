import { context } from "./context";

export const hookManager = {
  runComponent<P extends Record<string, unknown> = Record<string, unknown>>(
    path: string,
    componentFunction: React.ComponentType<P>,
    props: P,
  ) {
    context.hooks.visited.add(path);

    context.hooks.componentStack.push(path);
    context.hooks.cursor.set(path, 0);
    context.hooks.effectCursor.set(path, 0);

    try {
      return componentFunction(props);
    } finally {
      context.hooks.componentStack.pop();
    }
  },

  increaseCursor(path: string) {
    const currentCursor = context.hooks.cursor.get(path) ?? 0;
    context.hooks.cursor.set(path, currentCursor + 1);
  },

  increaseEffectCursor(path: string) {
    const currentEffectCursor = context.hooks.effectCursor.get(path) ?? 0;
    context.hooks.effectCursor.set(path, currentEffectCursor + 1);
  },
};
