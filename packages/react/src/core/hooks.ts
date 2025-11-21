import { enqueueRender } from "./render";
import { storeContext, runtimeContext } from "./context";
import { StateHook, EffectHook } from "./types";
import { shallowEquals } from "../utils";

const getCurrentHook = () => {
  const path = runtimeContext.cursor.path;
  if (!path) throw new Error("Hooks must be called within a component");

  const index = runtimeContext.cursor.index;
  const hooks = storeContext.hooks.get(path) || [];

  if (!storeContext.hooks.has(path)) {
    storeContext.hooks.set(path, hooks);
  }

  return {
    hooks,
    currentHook: hooks[index] as StateHook<unknown> | EffectHook | undefined,
    index,
    path,
  };
};

export const useState = <T>(initialValue: T | (() => T)): [T, (nextValue: T | ((prev: T) => T)) => void] => {
  const { hooks, currentHook, index } = getCurrentHook();

  if (!currentHook) {
    const initialState = typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
    const newHook: StateHook<T> = {
      tag: "STATE",
      state: initialState,
    };
    hooks[index] = newHook;
  } else if (currentHook.tag !== "STATE") {
    throw new Error("Hook order mismatch: Expected STATE but got " + currentHook.tag);
  }

  const hook = hooks[index] as StateHook<T>;
  const state = hook.state;

  const setState = (nextValue: T | ((prev: T) => T)) => {
    const newState = typeof nextValue === "function" ? (nextValue as (prev: T) => T)(hook.state) : nextValue;

    if (Object.is(newState, hook.state)) return;

    hook.state = newState;
    enqueueRender();
  };

  runtimeContext.cursor.index++;
  return [state, setState];
};

export const useEffect = (effect: () => (() => void) | void, deps?: unknown[]): void => {
  const { hooks, currentHook, index, path } = getCurrentHook();

  const prevDeps = currentHook?.tag === "EFFECT" ? currentHook.deps : null;
  const shouldRun = !currentHook || !deps || !prevDeps || !shallowEquals(prevDeps, deps);

  if (!currentHook) {
    const newHook: EffectHook = {
      tag: "EFFECT",
      path,
      deps: deps ?? null,
      cleanup: null,
      effect,
    };
    hooks[index] = newHook;
    if (shouldRun) {
      runtimeContext.workQueue.passiveEffects.push(newHook);
    }
  } else if (currentHook.tag !== "EFFECT") {
    throw new Error("Hook order mismatch: Expected EFFECT but got " + currentHook.tag);
  } else {
    // Update existing hook
    const hook = currentHook as EffectHook;
    hook.deps = deps ?? null;
    hook.effect = effect;

    if (shouldRun) {
      runtimeContext.workQueue.passiveEffects.push(hook);
    }
  }

  runtimeContext.cursor.index++;
};

export const cleanupUnusedHooks = () => {
  for (const [path, hooks] of storeContext.hooks) {
    if (!runtimeContext.visited.has(path)) {
      // queue cleanup functions before deleting the hook
      hooks.forEach((hook) => {
        if (hook.tag === "EFFECT" && hook.cleanup) {
          runtimeContext.workQueue.cleanups.push(hook.cleanup);
        }
      });

      storeContext.hooks.delete(path);
      storeContext.cleanupEffects.delete(path);
    }
  }
};
