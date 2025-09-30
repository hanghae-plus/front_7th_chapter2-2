/* eslint-disable @typescript-eslint/no-explicit-any */
import { NodeType, NodeTypes } from "./constants";
import { Instance } from "./types";

const isEvent = (key: string): boolean => /^on[A-Z]/.test(key);

const setEvent = (dom: HTMLElement, key: string, value: any, previousValue: any): void => {
  const eventName = key.slice(2).toLowerCase();
  if (typeof previousValue === "function" && previousValue !== value) {
    dom.removeEventListener(eventName, previousValue);
  }
  if (typeof value === "function" && previousValue !== value) {
    dom.addEventListener(eventName, value);
  }
  if (typeof value !== "function" && typeof previousValue === "function") {
    dom.removeEventListener(eventName, previousValue);
  }
};

const setStyle = (dom: HTMLElement, key: string, value: any, previousValue: any): void => {
  const nextStyle = value && typeof value === "object" ? value : {};
  const prevStyle = previousValue && typeof previousValue === "object" ? previousValue : {};
  Object.keys(prevStyle).forEach((name) => {
    if (!(name in nextStyle)) {
      (dom.style as any)[name] = "";
    }
  });
  Object.entries(nextStyle).forEach(([name, styleValue]) => {
    (dom.style as any)[name] = styleValue ?? "";
  });
};

const setProp = (dom: HTMLElement, key: string, value: any, previousValue: any): void => {
  if (isEvent(key)) {
    setEvent(dom, key, value, previousValue);
    return;
  }

  if (key === "className") {
    dom.className = value ?? "";
    return;
  }

  if (key === "style") {
    setStyle(dom, key, value, previousValue);
    return;
  }

  if (key in dom && typeof value !== "object") {
    (dom as any)[key] = value;
  } else {
    dom.setAttribute(key, value === true ? "" : value);
  }
};

export const setDomProps = (dom: HTMLElement, props: Record<string, any>): void =>
  Object.entries(props ?? {}).forEach(([key, value]) => {
    if (key === "children") {
      return;
    }
    setProp(dom, key, value, undefined);
  });

export const updateDomProps = (
  dom: HTMLElement,
  prevProps: Record<string, any> = {},
  nextProps: Record<string, any> = {},
): void => {
  Object.keys(prevProps)
    .filter((key) => key !== "children" && !(key in nextProps))
    .forEach((key) => setProp(dom, key, undefined, prevProps[key]));

  Object.entries(nextProps)
    .filter(([key, value]) => (key !== "children" && prevProps[key] !== value) || key === "style")
    .forEach(([key, value]) => setProp(dom, key, value, prevProps[key]));
};

const NODES: NodeType[] = [NodeTypes.HOST, NodeTypes.TEXT];
export const getDomNodes = (instance: Instance | null): (HTMLElement | Text)[] => {
  if (!instance) {
    return [];
  }
  if (NODES.includes(instance.kind)) {
    return instance.dom ? [instance.dom as HTMLElement | Text] : [];
  }
  return instance.children?.flatMap((child) => getDomNodes(child)) ?? [];
};

export const getFirstDom = (instance: Instance | null): HTMLElement | Text | null => getDomNodes(instance)[0] ?? null;

export const getFirstDomFromChildren = (children: (Instance | null)[]): HTMLElement | Text | null => {
  for (const child of children ?? []) {
    const dom = getFirstDom(child);
    if (dom) return dom;
  }
  return null;
};

export const insertInstance = (
  parentDom: HTMLElement,
  instance: Instance | null,
  anchor: HTMLElement | Text | null = null,
): void =>
  getDomNodes(instance)
    .filter(Boolean)
    .forEach((node) => {
      const currentParent = node.parentNode;
      const currentNextSibling = node.nextSibling;

      const shouldMove =
        currentParent !== parentDom ||
        (anchor && currentNextSibling !== anchor) ||
        (!anchor && currentNextSibling !== null);

      if (!shouldMove) {
        return;
      }

      if (anchor) {
        parentDom.insertBefore(node, anchor);
      } else {
        parentDom.appendChild(node);
      }
    });

export const removeInstance = (parentDom: HTMLElement, instance: Instance | null): void =>
  getDomNodes(instance).forEach((node) => node.parentNode?.removeChild(node));
