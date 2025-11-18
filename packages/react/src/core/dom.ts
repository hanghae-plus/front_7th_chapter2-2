/* eslint-disable @typescript-eslint/no-explicit-any */
import { NodeTypes } from "./constants";
import { Instance } from "./types";

const isEventProp = (key: string) => key.startsWith("on");
const isStyleProp = (key: string) => key === "style";
const isChildrenProp = (key: string) => key === "children";
const isAttributeProp = (key: string) => key.startsWith("data-") || key.startsWith("aria-");

/**
 * 단일 속성을 DOM에 설정합니다.
 */
const setProp = ({ dom, key, value }: { dom: HTMLElement; key: string; value: any }): void => {
  if (isEventProp(key)) {
    const eventType = key.toLowerCase().substring(2);
    dom.addEventListener(eventType, value);
    return;
  }

  if (isStyleProp(key)) {
    Object.assign(dom.style, value);
    return;
  }

  if (key === "className") {
    dom.className = value;
    return;
  }

  if (isAttributeProp(key)) {
    dom.setAttribute(key, value);
    return;
  }

  if (key in dom) {
    (dom as any)[key] = value;
    return;
  }

  dom.setAttribute(key, value);
};

/**
 * 단일 속성을 DOM에서 제거합니다.
 */
const removeProp = ({ dom, key, oldValue }: { dom: HTMLElement; key: string; oldValue?: any }): void => {
  if (isEventProp(key)) {
    if (oldValue) {
      const eventType = key.toLowerCase().substring(2);
      dom.removeEventListener(eventType, oldValue);
    }
    return;
  }

  if (isStyleProp(key)) {
    Object.keys(oldValue || {}).forEach((styleProp) => {
      (dom.style as any)[styleProp] = "";
    });
    return;
  }

  if (key === "className") {
    dom.className = "";
    return;
  }

  if (isAttributeProp(key)) {
    dom.removeAttribute(key);
    return;
  }

  if (key in dom) {
    (dom as any)[key] = "";
    return;
  }

  dom.removeAttribute(key);
};

/**
 * DOM 요소에 속성(props)을 설정합니다.
 * 이벤트 핸들러, 스타일, className 등 다양한 속성을 처리해야 합니다.
 */
export const setDomProps = (dom: HTMLElement, props: Record<string, any> = {}): void => {
  if (!props) {
    return;
  }

  Object.keys(props).forEach((key) => {
    if (isChildrenProp(key)) {
      return;
    }

    setProp({ dom, key, value: props[key] });
  });
};

/**
 * 이전에는 있었지만 새로운 props에는 없는 속성들을 제거합니다.
 */
const removeMissingProps = (dom: HTMLElement, prevProps: Record<string, any>, nextProps: Record<string, any>): void => {
  Object.keys(prevProps).forEach((key) => {
    if (isChildrenProp(key)) {
      return;
    }

    // 새로운 props에 없으면 제거
    if (!(key in nextProps)) {
      removeProp({ dom, key, oldValue: prevProps[key] });
    }
  });
};

/**
 * 값이 변경된 속성들만 업데이트합니다.
 */
const updateChangedProps = (dom: HTMLElement, prevProps: Record<string, any>, nextProps: Record<string, any>): void => {
  Object.keys(nextProps).forEach((key) => {
    if (isChildrenProp(key)) {
      return;
    }

    const value = nextProps[key];
    const prevValue = prevProps[key];

    // 값이 변경된 경우에만 업데이트
    if (value !== prevValue) {
      // 이벤트 핸들러가 변경된 경우 이전 것을 먼저 제거
      if (isEventProp(key) && prevValue) {
        const eventType = key.toLowerCase().substring(2);
        dom.removeEventListener(eventType, prevValue);
      }

      setProp({ dom, key, value });
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
  // 1단계: 제거된 속성 처리
  removeMissingProps(dom, prevProps, nextProps);

  // 2단계: 변경된 속성 업데이트
  updateChangedProps(dom, prevProps, nextProps);
};

/**
 * 주어진 인스턴스에서 실제 DOM 노드(들)를 재귀적으로 찾아 배열로 반환합니다.
 * Fragment나 컴포넌트 인스턴스는 여러 개의 DOM 노드를 가질 수 있습니다.
 */
export const getDomNodes = (instance: Instance | null): (HTMLElement | Text)[] => {
  // 여기를 구현하세요.

  if (!instance) {
    return [];
  }

  // HOST나 TEXT 노드는 DOM을 직접 가지고 있음
  if (instance.kind === NodeTypes.HOST || instance.kind === NodeTypes.TEXT) {
    return instance.dom ? [instance.dom] : [];
  }

  // Fragment나 Component는 자식들의 DOM을 수집
  const nodes: (HTMLElement | Text)[] = [];
  for (const child of instance.children) {
    nodes.push(...getDomNodes(child));
  }
  return nodes;
};

/**
 * 주어진 인스턴스에서 첫 번째 실제 DOM 노드를 찾습니다. -> DOM에서 위치를 지정할 때 필요함
 */
export const getFirstDom = (instance: Instance | null): HTMLElement | Text | null => {
  // 여기를 구현하세요.

  if (!instance) {
    return null;
  }

  if (instance.kind === NodeTypes.HOST || instance.kind === NodeTypes.TEXT) {
    return instance.dom;
  }

  return getFirstDomFromChildren(instance.children);
};

/**
 * 자식 인스턴스들로부터 첫 번째 실제 DOM 노드를 찾습니다.
 */
export const getFirstDomFromChildren = (children: (Instance | null)[]): HTMLElement | Text | null => {
  // 여기를 구현하세요.

  for (const child of children) {
    const dom = getFirstDom(child);
    if (dom) {
      return dom;
    }
  }
  return null;
};

/**
 * 인스턴스를 부모 DOM에 삽입합니다.
 * anchor 노드가 주어지면 그 앞에 삽입하여 순서를 보장합니다.
 *
 * 사용 사례:
 * - 새로 생성된 인스턴스를 DOM에 추가할 때
 * - 특정 위치(anchor) 앞에 인스턴스를 삽입할 때
 * - Fragment나 Component처럼 여러 DOM 노드를 가진 인스턴스를 한 번에 삽입할 때
 * - reconcileChildren에서 자식 순서를 재배치할 때
 */
export const insertInstance = (
  parentDom: HTMLElement,
  instance: Instance | null,
  anchor: HTMLElement | Text | null = null,
): void => {
  // 여기를 구현하세요.

  if (!instance) {
    return;
  }

  const domNodes = getDomNodes(instance);
  for (const node of domNodes) {
    // 이미 올바른 위치에 있으면 건너뜀
    if (node.parentNode === parentDom && node.nextSibling === anchor) {
      continue;
    }

    // anchor가 있으면 그 앞에 삽입, 없으면 맨 뒤에 추가
    if (anchor) {
      parentDom.insertBefore(node, anchor);
    } else {
      parentDom.appendChild(node);
    }
  }
};

/**
 * 부모 DOM에서 인스턴스에 해당하는 모든 DOM 노드를 제거합니다.
 */
export const removeInstance = (parentDom: HTMLElement, instance: Instance | null): void => {
  // 여기를 구현하세요.

  if (!instance) {
    return;
  }

  const domNodes = getDomNodes(instance);
  for (const node of domNodes) {
    if (node.parentNode === parentDom) {
      parentDom.removeChild(node);
    }
  }
};
