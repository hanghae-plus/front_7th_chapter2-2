/* eslint-disable @typescript-eslint/no-explicit-any */
import { NodeTypes } from "./constants";
import { Instance } from "./types";

/**
 * DOM 요소에 속성(props)을 설정합니다.
 * 이벤트 핸들러, 스타일, className 등 다양한 속성을 처리해야 합니다.
 */
export const setDomProps = (dom: HTMLElement, props: Record<string, any>): void => {
  Object.keys(props).forEach((key) => {
    // children, key, ref, nodeValue는 건너뜀
    if (key === "children" || key === "key" || key === "ref" || key === "nodeValue") {
      return;
    }

    const value = props[key];

    // 이벤트 핸들러 (onClick, onChange 등)
    if (key.startsWith("on") && typeof value === "function") {
      const eventType = key.substring(2).toLowerCase();
      dom.addEventListener(eventType, value);
      return;
    }

    // style 객체
    if (key === "style" && typeof value === "object") {
      Object.assign(dom.style, value);
      return;
    }

    // className
    if (key === "className") {
      dom.className = value;
      return;
    }

    // boolean 속성 (disabled, checked 등)
    if (typeof value === "boolean") {
      if (value) {
        dom.setAttribute(key, "");
      }
      return;
    }

    // 일반 속성
    if (value != null) {
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
  // 이전 속성 중 제거된 것들 처리
  Object.keys(prevProps).forEach((key) => {
    if (key === "children" || key === "key" || key === "ref" || key === "nodeValue") {
      return;
    }

    // 새 props에 없으면 제거
    if (!(key in nextProps)) {
      // 이벤트 핸들러 제거
      if (key.startsWith("on") && typeof prevProps[key] === "function") {
        const eventType = key.substring(2).toLowerCase();
        dom.removeEventListener(eventType, prevProps[key]);
        return;
      }

      // style 속성 제거
      if (key === "style" && typeof prevProps[key] === "object") {
        Object.keys(prevProps[key]).forEach((styleKey) => {
          (dom.style as any)[styleKey] = "";
        });
        return;
      }

      // 일반 속성 제거
      dom.removeAttribute(key);
    }
  });

  // 새로운 속성 추가/업데이트
  Object.keys(nextProps).forEach((key) => {
    if (key === "children" || key === "key" || key === "ref" || key === "nodeValue") {
      return;
    }

    const prevValue = prevProps[key];
    const nextValue = nextProps[key];

    // 값이 같으면 건너뛰기
    if (prevValue === nextValue) {
      return;
    }

    // 이벤트 핸들러
    if (key.startsWith("on") && typeof nextValue === "function") {
      const eventType = key.substring(2).toLowerCase();

      // 이전 핸들러 제거
      if (typeof prevValue === "function") {
        dom.removeEventListener(eventType, prevValue);
      }

      // 새 핸들러 추가
      dom.addEventListener(eventType, nextValue);
      return;
    }

    // style 객체
    if (key === "style" && typeof nextValue === "object") {
      // 이전 style 속성 제거
      if (typeof prevValue === "object") {
        Object.keys(prevValue).forEach((styleKey) => {
          if (!(styleKey in nextValue)) {
            (dom.style as any)[styleKey] = "";
          }
        });
      }

      // 새 style 속성 추가
      Object.assign(dom.style, nextValue);
      return;
    }

    // className
    if (key === "className") {
      dom.className = nextValue;
      return;
    }

    // boolean 속성
    if (typeof nextValue === "boolean") {
      if (nextValue) {
        dom.setAttribute(key, "");
      } else {
        dom.removeAttribute(key);
      }
      return;
    }

    // 일반 속성
    if (nextValue != null) {
      dom.setAttribute(key, nextValue);
    } else {
      dom.removeAttribute(key);
    }
  });
};

/**
 * 주어진 인스턴스에서 실제 DOM 노드(들)를 재귀적으로 찾아 배열로 반환합니다.
 * Fragment나 컴포넌트 인스턴스는 여러 개의 DOM 노드를 가질 수 있습니다.
 */
export const getDomNodes = (instance: Instance | null): (HTMLElement | Text)[] => {
  if (!instance) {
    return [];
  }

  // HOST나 TEXT 노드는 직접 DOM을 가짐
  if (instance.kind === NodeTypes.HOST || instance.kind === NodeTypes.TEXT) {
    return instance.dom ? [instance.dom] : [];
  }

  // COMPONENT나 FRAGMENT는 자식들의 DOM을 재귀적으로 수집
  const result: (HTMLElement | Text)[] = [];
  for (const child of instance.children) {
    result.push(...getDomNodes(child));
  }
  return result;
};

/**
 * 주어진 인스턴스에서 첫 번째 실제 DOM 노드를 찾습니다.
 */
export const getFirstDom = (instance: Instance | null): HTMLElement | Text | null => {
  if (!instance) {
    return null;
  }

  // HOST나 TEXT 노드는 직접 DOM을 가짐
  if (instance.kind === NodeTypes.HOST || instance.kind === NodeTypes.TEXT) {
    return instance.dom;
  }

  // COMPONENT나 FRAGMENT는 자식들에서 첫 번째 DOM 찾기
  return getFirstDomFromChildren(instance.children);
};

/**
 * 자식 인스턴스들로부터 첫 번째 실제 DOM 노드를 찾습니다.
 */
export const getFirstDomFromChildren = (children: (Instance | null)[]): HTMLElement | Text | null => {
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
 */
export const insertInstance = (
  parentDom: HTMLElement,
  instance: Instance | null,
  anchor: HTMLElement | Text | null = null,
): void => {
  if (!instance) {
    return;
  }

  // 인스턴스의 모든 DOM 노드를 가져옴
  const domNodes = getDomNodes(instance);

  // 각 DOM 노드를 삽입
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
  if (!instance) {
    return;
  }

  // 인스턴스의 모든 DOM 노드를 가져옴
  const domNodes = getDomNodes(instance);

  // 각 DOM 노드를 제거
  domNodes.forEach((node) => {
    if (node.parentNode === parentDom) {
      parentDom.removeChild(node);
    }
  });
};
