export const createObserver = () => {
  const listeners = new Set();
  const subscribe = (fn) => {
    listeners.add(fn);
    // unsubscribe 함수 반환
    return () => {
      listeners.delete(fn);
    };
  };
  const notify = () => {
    listeners.forEach((listener) => listener());
  };

  return { subscribe, notify };
};
