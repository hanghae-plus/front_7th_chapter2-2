import { setup, type VNode } from "../core";

export const createRoot = (rootElement: HTMLElement) => {
  return {
    render: (root: VNode | null) => setup(root, rootElement),
  };
};
