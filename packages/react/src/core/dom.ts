/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEmptyValue } from "../utils";
import { Instance } from "./types";
// import { NodeType, NodeTypes } from "./constants";

/**
 * DOM 요소에 속성(props)을 설정합니다.
 * 이벤트 핸들러, 스타일, className 등 다양한 속성을 처리해야 합니다.
 */
export const setDomProps = (dom: HTMLElement, props: Record<string, any>): void => {
  Object.entries(props).forEach(([key, value]) => {
    if (key === "children") {
      return; // children은 별도로 처리
    }

    if (key === "style" && typeof value === "object") {
      // style 객체 처리
      Object.entries(value).forEach(([styleKey, styleValue]) => {
        (dom.style as any)[styleKey] = styleValue;
      });
    } else if (key === "className") {
      // className 처리
      dom.className = value;
    } else if (key.startsWith("on")) {
      // 이벤트 핸들러 처리
      const eventType = key.toLowerCase().substring(2);
      dom.addEventListener(eventType, value);
    } else if (key in dom) {
      // DOM 프로퍼티로 직접 설정 (checked, value, disabled 등)
      (dom as any)[key] = value;
    } else {
      // 일반 속성 설정
      dom.setAttribute(key, value);
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
  // 이전 속성 제거
  Object.keys(prevProps).forEach((key) => {
    if (key === "children") {
      return;
    }

    if (!(key in nextProps)) {
      if (key.startsWith("on")) {
        const eventType = key.toLowerCase().substring(2);
        dom.removeEventListener(eventType, prevProps[key]);
      } else if (key === "className") {
        dom.className = "";
      } else if (key === "style") {
        dom.removeAttribute("style");
      } else if (key in dom) {
        (dom as any)[key] = "";
      } else {
        dom.removeAttribute(key);
      }
    }
  });

  // 새 속성 추가/업데이트
  Object.entries(nextProps).forEach(([key, value]) => {
    if (key === "children") {
      return;
    }

    const prevValue = prevProps[key];

    if (prevValue === value) {
      return; // 변경 없음
    }

    if (key === "style" && typeof value === "object") {
      Object.entries(value).forEach(([styleKey, styleValue]) => {
        (dom.style as any)[styleKey] = styleValue;
      });
    } else if (key === "className") {
      dom.className = value;
    } else if (key.startsWith("on")) {
      const eventType = key.toLowerCase().substring(2);
      if (prevValue) {
        dom.removeEventListener(eventType, prevValue);
      }
      dom.addEventListener(eventType, value);
    } else if (key in dom) {
      (dom as any)[key] = value;
    } else {
      dom.setAttribute(key, value);
    }
  });
};

/**
 * 주어진 인스턴스에서 실제 DOM 노드(들)를 재귀적으로 찾아 배열로 반환합니다.
 * Fragment나 컴포넌트 인스턴스는 여러 개의 DOM 노드를 가질 수 있습니다.
 */
export const getDomNodes = (instance: Instance | null): (HTMLElement | Text)[] => {
  if (!instance) return [];

  // 1) host/text이면 자기 dom 그대로 반환
  if (instance.dom) {
    return [instance.dom];
  }

  // 2) function component / fragment → children dom 반환
  const nodes: (HTMLElement | Text)[] = [];
  for (const child of instance.children) {
    nodes.push(...getDomNodes(child));
  }
  return nodes;
};

/**
 * 주어진 인스턴스에서 첫 번째 실제 DOM 노드를 찾습니다.
 */
export const getFirstDom = (instance: Instance | null): HTMLElement | Text | null => {
  if (isEmptyValue(instance)) {
    return null;
  }

  // 현재 인스턴스가 실제 DOM을 갖고 있다면 즉시 반환
  if (instance!.dom) {
    return instance!.dom;
  }

  // 함수형 컴포넌트나 Fragment 등 → 자식에서 첫 DOM을 찾기
  for (const child of instance!.children) {
    const dom = getFirstDom(child);
    if (dom) return dom;
  }

  return null;
};

/**
 * 자식 인스턴스들로부터 첫 번째 실제 DOM 노드를 찾습니다.
 */
export const getFirstDomFromChildren = (children: (Instance | null)[]): HTMLElement | Text | null => {
  if (isEmptyValue(children)) {
    return null;
  }
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

  const nodes = getDomNodes(instance);
  for (const node of nodes) {
    parentDom.insertBefore(node, anchor);
  }
};

/**
 * 부모 DOM에서 인스턴스에 해당하는 모든 DOM 노드를 제거합니다.
 */
export const removeInstance = (parentDom: HTMLElement, instance: Instance | null): void => {
  if (!instance) return;

  const nodes = getDomNodes(instance);

  for (const node of nodes) {
    if (node.parentNode === parentDom) {
      parentDom.removeChild(node);
    }
  }
};
