/* eslint-disable @typescript-eslint/no-explicit-any */
import { NodeTypes } from "./constants";
import { Instance } from "./types";

const isStyleKey = (
  style: CSSStyleDeclaration,
  styleKey: string | number | symbol,
): styleKey is keyof CSSStyleDeclaration => {
  return styleKey in style;
};

/**
 * DOM 요소에 속성(props)을 설정합니다.
 * 이벤트 핸들러, 스타일, className 등 다양한 속성을 처리해야 합니다.
 */
export const setDomProps = (dom: HTMLElement, props: Record<string, any>): void => {
  Object.keys(props).forEach((key) => {
    if (key === "children") return;

    const value = props[key];

    // 이벤트 핸들러
    if (key.startsWith("on")) {
      const eventName = key.toLowerCase().replace("on", "");
      dom.addEventListener(eventName, value);
      return;
    }

    // 스타일 객체
    if (key === "style" && typeof value === "object") {
      let styleString = "";

      Object.keys(value).forEach((styleKey) => {
        if (!isStyleKey(dom.style, styleKey)) return;

        styleString += `${styleKey.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value[styleKey]};`;
      });

      dom.setAttribute("style", styleString);

      return;
    }

    // className
    if (key === "className") {
      dom.setAttribute("class", value || "");
      return;
    }

    if (key === "value" && dom instanceof HTMLInputElement) {
      dom.value = value;
    }

    // 일반 속성
    if (value === true) {
      dom.setAttribute(key, "");
    } else if (value === false || value === null) {
      dom.removeAttribute(key);
    } else {
      (dom as Record<string, any>)[key] = value;
      dom.setAttribute(key, String(value));
    }
  });
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
  Object.keys(prevProps).forEach((key) => {
    if (key === "children") return;
    if (key in nextProps) return;

    if (key.startsWith("on")) {
      const eventName = key.toLowerCase().replace("on", "");
      dom.removeEventListener(eventName, prevProps[key]);
      return;
    }

    if (key === "className") {
      dom.removeAttribute("class");
      return;
    }

    dom.removeAttribute(key);
  });

  Object.keys(nextProps).forEach((key) => {
    if (key === "children") return;

    const prevValue = prevProps[key];
    const nextValue = nextProps[key];

    if (prevValue === nextValue) return;

    if (key.startsWith("on")) {
      const eventName = key.toLowerCase().replace("on", "");

      if (prevProps) dom.removeEventListener(eventName, prevValue);
      if (nextValue) dom.addEventListener(eventName, nextValue);

      return;
    }

    if (key === "style") {
      let styleString = "";

      Object.keys(nextValue).forEach((styleKey) => {
        if (!isStyleKey(dom.style, styleKey)) return;

        styleString += `${styleKey.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${nextValue[styleKey]};`;
      });

      dom.setAttribute("style", styleString);

      return;
    }

    if (key === "className") {
      dom.setAttribute("class", nextValue || "");
      return;
    }

    if (key === "value" && dom instanceof HTMLInputElement) {
      dom.value = nextValue;
    }

    if (nextValue === true) {
      dom.setAttribute(key, "");
    } else if (nextValue === false || nextValue == null) {
      dom.removeAttribute(key);
    } else {
      dom.setAttribute(key, String(nextValue));
    }
  });
};

/**
 * 주어진 인스턴스에서 실제 DOM 노드(들)를 재귀적으로 찾아 배열로 반환합니다.
 * Fragment나 컴포넌트 인스턴스는 여러 개의 DOM 노드를 가질 수 있습니다.
 */
export const getDomNodes = (instance: Instance | null): (HTMLElement | Text)[] => {
  if (!instance) return [];

  if (instance.kind === NodeTypes.HOST || instance.kind === NodeTypes.TEXT) {
    return instance.dom ? [instance.dom] : [];
  }

  const nodes: (HTMLElement | Text)[] = [];
  instance.children.forEach((child) => nodes.push(...getDomNodes(child))); // 재귀 호출

  return nodes;
};

/**
 * 주어진 인스턴스에서 첫 번째 실제 DOM 노드를 찾습니다.
 */
export const getFirstDom = (instance: Instance | null): HTMLElement | Text | null => {
  if (!instance) return null;

  if (instance.kind === NodeTypes.HOST || instance.kind === NodeTypes.TEXT) return instance.dom;

  return getFirstDomFromChildren(instance.children);
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

  const domNodes = getDomNodes(instance);

  domNodes.forEach((node) => {
    if (anchor) {
      parentDom.insertBefore(node, anchor);
    } else {
      parentDom.appendChild(node);
    }
  });
};

/**
 * 부모 DOM에서 인스턴스에 해당하는 모든 DOM 노드를 제거합니다.
 */
export const removeInstance = (parentDom: HTMLElement, instance: Instance | null): void => {
  if (!instance) return;

  const domNodes = getDomNodes(instance);

  domNodes.forEach((node) => parentDom.removeChild(node));
};
