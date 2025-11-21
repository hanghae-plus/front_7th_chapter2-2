import { storeContext } from "./context";
import { EffectHook } from "./types";

export const flushPassiveEffects = (newEffects: EffectHook[], unmountCleanups: (() => void)[]) => {
  // unmount components
  unmountCleanups.forEach((cleanup) => cleanup());

  // execute previous cleanup functions
  newEffects.forEach((effect) => {
    // execute previous cleanup functions
    const cleanups = storeContext.cleanupEffects.get(effect.path);
    if (cleanups) {
      cleanups.forEach((cleanup) => cleanup());
      storeContext.cleanupEffects.delete(effect.path);
    }

    if (effect.cleanup) {
      effect.cleanup();
      effect.cleanup = null;
    }
  });

  newEffects.forEach((effect) => {
    try {
      const cleanupFn = effect.effect();
      if (typeof cleanupFn === "function") {
        effect.cleanup = cleanupFn;
      } else {
        effect.cleanup = null;
      }
    } catch (e) {
      console.error(e);
    }
  });
};
