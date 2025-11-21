import { runtimeContext } from "./context";

export const hookManager = {
  runComponent<P extends Record<string, unknown> = Record<string, unknown>>(
    path: string,
    componentFunction: React.ComponentType<P>,
    props: P,
  ) {
    runtimeContext.visited.add(path);
    runtimeContext.componentStack.push(path);

    runtimeContext.cursor.path = path;
    runtimeContext.cursor.index = 0;

    try {
      return componentFunction(props);
    } finally {
      runtimeContext.componentStack.pop();
      runtimeContext.cursor.path = runtimeContext.componentStack[runtimeContext.componentStack.length - 1] ?? null;
    }
  },
};
