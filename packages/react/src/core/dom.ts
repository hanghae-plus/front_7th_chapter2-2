/* eslint-disable @typescript-eslint/no-explicit-any */
import { Instance } from "./types";

/**
 * DOM 요소에 속성(props)을 설정합니다.
 * 이벤트 핸들러, 스타일, className 등 다양한 속성을 처리해야 합니다.
 */
export const setDomProps = (dom: HTMLElement, props: Record<string, any>): void => {
  for (const key in props) {
    applyProp(dom, key, undefined, props[key]);
  }
};

/**
 * 이전 속성과 새로운 속성을 비교하여 DOM 요소의 속성을 업데이트합니다.
 * 변경된 속성만 효율적으로 DOM에 반영해야 합니다.
 */
export const updateDomProps = (
  dom: HTMLElement,
  prevProps: Record<string, any> = {},
  nextProps: Record<string, any> = {},
): void => {
  for (const key in prevProps) {
    if (!(key in nextProps)) {
      applyProp(dom, key, prevProps[key], undefined);
    }
  }

  for (const key in nextProps) {
    if (prevProps[key] === nextProps[key]) continue;
    applyProp(dom, key, prevProps[key], nextProps[key]);
  }
};

/**
 * 주어진 인스턴스에서 실제 DOM 노드(들)를 재귀적으로 찾아 배열로 반환합니다.
 * Fragment나 컴포넌트 인스턴스는 여러 개의 DOM 노드를 가질 수 있습니다.
 */
export const getDomNodes = (instance: Instance | null): (HTMLElement | Text)[] => {
  if (!instance) return [];

  if (instance.dom) {
    return [instance.dom];
  }

  const doms: (HTMLElement | Text)[] = [];
  for (const child of instance.children) {
    doms.push(...getDomNodes(child));
  }
  return doms;
};

/**
 * 주어진 인스턴스에서 첫 번째 실제 DOM 노드를 찾습니다.
 */
export const getFirstDom = (instance: Instance | null): HTMLElement | Text | null => {
  if (!instance) return null;

  if (instance.dom) return instance.dom;

  for (const child of instance.children) {
    const found = getFirstDom(child);
    if (found) return found;
  }

  return null;
};

/**
 * 자식 인스턴스들로부터 첫 번째 실제 DOM 노드를 찾습니다.
 */
export const getFirstDomFromChildren = (children: (Instance | null)[]): HTMLElement | Text | null => {
  for (const child of children) {
    const dom = getFirstDom(child);
    if (dom) return dom;
  }
  return null;
};

/**
 * 인스턴스를 부모 DOM에 삽입합니다.
 * anchor 노드가 주어지면 그 앞에 삽입하여 순서를 보장합니다.
 */
export const insertInstance = (
  parentDom: HTMLElement,
  instance: Instance | null,
  anchor: HTMLElement | Text | null = null,
): void => {
  if (!instance) return;

  const doms = getDomNodes(instance);
  for (const dom of doms) {
    if (anchor) parentDom.insertBefore(dom, anchor);
    else parentDom.appendChild(dom);
  }
};

/**
 * 부모 DOM에서 인스턴스에 해당하는 모든 DOM 노드를 제거합니다.
 */
export const removeInstance = (parentDom: HTMLElement, instance: Instance | null): void => {
  if (!instance) return;

  const doms = getDomNodes(instance);
  for (const dom of doms) {
    if (dom.parentNode === parentDom) {
      parentDom.removeChild(dom);
    }
  }
};

const isEventProp = (key: string): boolean => key.startsWith("on");

const getEventName = (key: string): string => key.slice(2).toLowerCase();

const shouldUseProperty = (dom: HTMLElement, key: string): boolean => {
  if (key === "children" || key === "className" || key === "style") return false;
  if (key.startsWith("data-") || key.startsWith("aria-")) return false;
  return key in dom;
};

const resetDomProperty = (dom: HTMLElement, key: string) => {
  if (!(key in dom)) return;
  const current = (dom as any)[key];
  if (typeof current === "boolean") {
    (dom as any)[key] = false;
  } else if (typeof current === "number") {
    (dom as any)[key] = 0;
  } else {
    (dom as any)[key] = "";
  }
};

const applyProp = (dom: HTMLElement, key: string, prev: any, next: any) => {
  if (key === "children") return;

  if (isEventProp(key)) {
    if (prev !== next) {
      if (typeof prev === "function") {
        dom.removeEventListener(getEventName(key), prev);
      }
      if (typeof next === "function") {
        dom.addEventListener(getEventName(key), next);
      }
    }
    return;
  }

  if (key === "className") {
    dom.className = next ?? "";
    return;
  }

  if (key === "style") {
    const nextStyle = typeof next === "object" && next ? next : {};
    const prevStyle = typeof prev === "object" && prev ? prev : {};
    const styleDecl = dom.style as unknown as Record<string, string>;
    for (const styleName in prevStyle) {
      if (!(styleName in nextStyle)) {
        styleDecl[styleName] = "";
      }
    }
    Object.assign(dom.style, nextStyle);
    return;
  }

  if (next == null) {
    if (shouldUseProperty(dom, key)) {
      resetDomProperty(dom, key);
    }
    dom.removeAttribute(key);
    return;
  }

  if (shouldUseProperty(dom, key)) {
    (dom as any)[key] = next;
    if (typeof next === "boolean" && next === false) {
      dom.removeAttribute(key);
    } else if (typeof next === "boolean" && next === true) {
      dom.setAttribute(key, "");
    }
    return;
  }

  dom.setAttribute(key, typeof next === "string" ? next : String(next));
};
