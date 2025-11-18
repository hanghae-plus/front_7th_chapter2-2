/* eslint-disable @typescript-eslint/no-explicit-any */
import { NodeTypes } from "./constants";
import { Instance } from "./types";

/**
 * DOM 요소에 속성(props)을 설정합니다.
 * 이벤트 핸들러, 스타일, className 등 다양한 속성을 처리해야 합니다.
 */
export const setDomProps = (dom: HTMLElement, props: Record<string, any>): void => {
  if (!props) return;
  Object.entries(props).forEach(([key, value]) => {
    if (key === "children") return;

    // style 객체 처리
    if (key === "style" && value && typeof value === "object") {
      const styleObject = value as Record<string, string | number | null | undefined>;
      Object.entries(styleObject).forEach(([styleName, styleValue]) => {
        (dom.style as any)[styleName] = styleValue != null ? String(styleValue) : "";
      });
      return;
    }

    // 이벤트 핸들러 처리
    if (key.startsWith("on") && typeof value === "function") {
      const eventName = key.slice(2).toLowerCase();
      dom.addEventListener(eventName, value);
      return;
    }

    // className 처리
    if (key === "className") {
      dom.className = value ?? "";
      return;
    }

    // data-* 속성 처리
    if (key.startsWith("data-")) {
      if (value != null) dom.setAttribute(key, String(value));
      return;
    }

    // boolean 속성 처리
    if (typeof value === "boolean") {
      if (key in dom) (dom as any)[key] = value;
      else if (value) dom.setAttribute(key, "");
      return;
    }

    // null/undefined 무시
    if (value == null) return;

    // 일반 속성 처리
    if (key in dom) (dom as any)[key] = value;
    else dom.setAttribute(key, String(value));
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
  // 제거되거나 변경된 props 처리
  Object.entries(prevProps).forEach(([key, prevValue]) => {
    if (key === "children" || key === "style") return;

    const nextValue = nextProps[key];
    const hasNext = Object.prototype.hasOwnProperty.call(nextProps, key);
    const isUnchanged = hasNext && nextValue === prevValue;

    if (isUnchanged) return;

    // 이벤트 핸들러 제거
    if (key.startsWith("on") && typeof prevValue === "function") {
      dom.removeEventListener(key.slice(2).toLowerCase(), prevValue);
      return;
    }

    // className 업데이트
    if (key === "className") {
      dom.className = hasNext ? (nextValue ?? "") : "";
      return;
    }

    // data-* 속성 제거
    if (key.startsWith("data-")) {
      if (!hasNext || nextValue == null) dom.removeAttribute(key);
      return;
    }

    // boolean 속성 제거
    if (!hasNext && typeof prevValue === "boolean") {
      if (key in dom) (dom as any)[key] = false;
      dom.removeAttribute(key);
      return;
    }

    // 일반 속성 제거
    if (!hasNext) {
      // 프로퍼티가 있으면 빈 문자열로 설정 시도 (읽기 전용 속성은 에러 발생 가능)
      if (key in dom) {
        try {
          (dom as any)[key] = "";
        } catch {
          // 읽기 전용 프로퍼티(innerHTML, tagName 등)는 무시하고 attribute만 제거
        }
      }
      // attribute 제거
      dom.removeAttribute(key);
    }
  });

  // style 객체 비교/반영
  const prevStyle = prevProps.style ?? {};
  const nextStyle = nextProps.style ?? {};
  const allStyleKeys = new Set([...Object.keys(prevStyle), ...Object.keys(nextStyle)]);

  allStyleKeys.forEach((name) => {
    const prevVal = prevStyle[name];
    const nextVal = nextStyle[name];
    if (prevVal === nextVal) return;

    (dom.style as any)[name] = nextVal != null ? String(nextVal) : "";
  });

  // 추가되거나 변경된 props 설정
  Object.entries(nextProps).forEach(([key, value]) => {
    if (key === "children" || key === "style") return;

    const prevValue = prevProps[key];
    const isUnchanged = value === prevValue;

    // 이벤트 핸들러 추가/교체
    if (key.startsWith("on") && typeof value === "function") {
      const eventName = key.slice(2).toLowerCase();
      if (typeof prevValue === "function" && prevValue !== value) dom.removeEventListener(eventName, prevValue);
      dom.addEventListener(eventName, value);
      return;
    }

    // 이벤트 핸들러가 null/undefined로 변경된 경우 제거
    if (key.startsWith("on") && typeof prevValue === "function" && (value == null || typeof value !== "function")) {
      dom.removeEventListener(key.slice(2).toLowerCase(), prevValue);
      return;
    }

    // className 설정
    if (key === "className") {
      if (!isUnchanged) dom.className = value ?? "";
      return;
    }

    // data-* 속성 설정
    if (key.startsWith("data-")) {
      if (value == null) dom.removeAttribute(key);
      else if (!isUnchanged) dom.setAttribute(key, String(value));
      return;
    }

    // boolean 속성 설정
    if (typeof value === "boolean") {
      if (key in dom) {
        if (!isUnchanged) (dom as any)[key] = value;
      } else {
        if (value) dom.setAttribute(key, "");
        else dom.removeAttribute(key);
      }
      return;
    }

    // 일반 속성 설정
    if (value == null || isUnchanged) return;

    if (key in dom) (dom as any)[key] = value;
    else dom.setAttribute(key, String(value));
  });
};

/**
 * 주어진 인스턴스에서 실제 DOM 노드(들)를 재귀적으로 찾아 배열로 반환합니다.
 * Fragment나 컴포넌트 인스턴스는 여러 개의 DOM 노드를 가질 수 있습니다.
 */
export const getDomNodes = (instance: Instance | null): (HTMLElement | Text)[] => {
  if (!instance) return [];

  const { dom, kind, children } = instance;

  // HOST/TEXT 노드는 자신이 가진 dom만 반환
  if (kind === NodeTypes.HOST || kind === NodeTypes.TEXT) return dom ? [dom] : [];

  // COMPONENT/FRAGMENT 노드는 자식 인스턴스에서 실제 DOM을 모아서 반환
  return children.flatMap((child) => getDomNodes(child));
};

/**
 * 주어진 인스턴스에서 첫 번째 실제 DOM 노드를 찾습니다.
 */
export const getFirstDom = (instance: Instance | null): HTMLElement | Text | null => {
  if (!instance) return null;

  const { dom, kind, children } = instance;

  // HOST/TEXT 노드는 자신의 dom이 첫 번째 실제 DOM 노드
  if ((kind === NodeTypes.HOST || kind === NodeTypes.TEXT) && dom) return dom;

  // COMPONENT/FRAGMENT 등은 자식 인스턴스들에서 첫 DOM 노드를 찾음
  for (const child of children) {
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

  const nodes = getDomNodes(instance);
  for (const node of nodes) {
    if (node.parentNode === parentDom && (anchor ? node.nextSibling === anchor : node.nextSibling === null)) continue;

    if (anchor) parentDom.insertBefore(node, anchor);
    else parentDom.appendChild(node);
  }
};

/**
 * 부모 DOM에서 인스턴스에 해당하는 모든 DOM 노드를 제거합니다.
 */
export const removeInstance = (parentDom: HTMLElement, instance: Instance | null): void => {
  if (!instance) return;

  const nodes = getDomNodes(instance);
  for (const node of nodes) {
    if (node.parentNode === parentDom) parentDom.removeChild(node);
  }
};
