/* eslint-disable @typescript-eslint/no-explicit-any */
import { NodeTypes } from "./constants";
import { Instance } from "./types";

/**
 * DOM 요소에 속성(props)을 설정합니다.
 * 이벤트 핸들러, 스타일, className 등 다양한 속성을 처리해야 합니다.
 */
export const setDomProps = (dom: HTMLElement, props: Record<string, any>): void => {
  // props가 없으면 아무것도 하지 않음
  if (!props) {
    return;
  }

  // props 객체의 각 속성을 순회하며 DOM에 설정
  Object.keys(props).forEach((key) => {
    const value = props[key];

    // children 속성은 DOM 속성이 아니므로 건너뜀
    if (key === "children") {
      return;
    }

    // 이벤트 핸들러 처리 (onClick, onChange 등 on으로 시작하는 속성)
    if (key.startsWith("on") && typeof value === "function") {
      const eventName = key.substring(2).toLowerCase(); // onClick -> click
      dom.addEventListener(eventName, value);
      return;
    }

    // style 속성 처리 (객체 형태)
    if (key === "style" && typeof value === "object" && value !== null) {
      Object.keys(value).forEach((styleKey) => {
        // camelCase를 kebab-case로 변환하지 않고 직접 설정
        // dom.style은 camelCase를 지원함
        (dom.style as any)[styleKey] = value[styleKey];
      });
      return;
    }

    // className 속성 처리
    if (key === "className") {
      dom.setAttribute("class", value);
      return;
    }

    // boolean 속성 처리 (checked, disabled, readOnly 등)
    if (typeof value === "boolean") {
      if (value) {
        dom.setAttribute(key, "");
      } else {
        dom.removeAttribute(key);
      }
      return;
    }

    // 일반 속성 처리 (문자열, 숫자 등)
    if (value != null) {
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
  // props가 없으면 빈 객체로 처리
  const prev = prevProps || {};
  const next = nextProps || {};

  // 1. 이전 속성 중 새 속성에 없는 것들을 제거
  Object.keys(prev).forEach((key) => {
    // children은 건너뜀
    if (key === "children") {
      return;
    }

    // 새 속성에 없는 경우만 제거
    if (!(key in next)) {
      // 이벤트 핸들러 제거
      if (key.startsWith("on") && typeof prev[key] === "function") {
        const eventName = key.substring(2).toLowerCase();
        dom.removeEventListener(eventName, prev[key]);
        return;
      }

      // style 속성 제거
      if (key === "style") {
        dom.removeAttribute("style");
        return;
      }

      // className 제거
      if (key === "className") {
        dom.removeAttribute("class");
        return;
      }

      // 일반 속성 제거
      dom.removeAttribute(key);
    }
  });

  // 2. 새 속성을 설정 (변경되거나 추가된 것들)
  Object.keys(next).forEach((key) => {
    const prevValue = prev[key];
    const nextValue = next[key];

    // children은 건너뜀
    if (key === "children") {
      return;
    }

    // 값이 변경되지 않았으면 건너뜀
    if (prevValue === nextValue) {
      return;
    }

    // 이벤트 핸들러 업데이트
    // nextValue가 함수가 아니어도 (null/undefined) 이전 핸들러를 제거해야 함
    if (key.startsWith("on")) {
      const eventName = key.substring(2).toLowerCase();

      // 이전 핸들러가 함수였다면 제거
      if (typeof prevValue === "function") {
        dom.removeEventListener(eventName, prevValue);
      }

      // 새 핸들러가 함수면 추가
      if (typeof nextValue === "function") {
        dom.addEventListener(eventName, nextValue);
      }

      return;
    }

    // style 속성 업데이트
    if (key === "style" && typeof nextValue === "object" && nextValue !== null) {
      const prevStyle = typeof prevValue === "object" && prevValue !== null ? prevValue : {};

      // 이전 스타일 중 새 스타일에 없는 것 제거
      Object.keys(prevStyle).forEach((styleKey) => {
        if (!(styleKey in nextValue)) {
          (dom.style as any)[styleKey] = "";
        }
      });

      // 새 스타일 적용
      Object.keys(nextValue).forEach((styleKey) => {
        (dom.style as any)[styleKey] = nextValue[styleKey];
      });
      return;
    }

    // className 업데이트
    if (key === "className") {
      dom.setAttribute("class", nextValue);
      return;
    }

    // boolean 속성 업데이트
    if (typeof nextValue === "boolean") {
      if (nextValue) {
        dom.setAttribute(key, "");
      } else {
        dom.removeAttribute(key);
      }
      return;
    }

    // 일반 속성 업데이트
    if (nextValue != null) {
      dom.setAttribute(key, String(nextValue));
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
  // 인스턴스가 null이면 빈 배열 반환
  if (!instance) {
    return [];
  }

  // HOST(일반 DOM 요소)나 TEXT(텍스트 노드)는 자신의 dom을 반환
  if (instance.kind === NodeTypes.HOST || instance.kind === NodeTypes.TEXT) {
    return instance.dom ? [instance.dom] : [];
  }

  // COMPONENT나 FRAGMENT는 자식들의 DOM 노드들을 수집
  const nodes: (HTMLElement | Text)[] = [];
  for (const child of instance.children) {
    // 재귀적으로 자식의 DOM 노드들을 수집
    nodes.push(...getDomNodes(child));
  }
  return nodes;
};

/**
 * 주어진 인스턴스에서 첫 번째 실제 DOM 노드를 찾습니다.
 */
export const getFirstDom = (instance: Instance | null): HTMLElement | Text | null => {
  // 인스턴스가 null이면 null 반환
  if (!instance) {
    return null;
  }

  // HOST나 TEXT는 자신의 dom을 반환
  if (instance.kind === NodeTypes.HOST || instance.kind === NodeTypes.TEXT) {
    return instance.dom;
  }

  // COMPONENT나 FRAGMENT는 자식들 중 첫 번째 DOM 노드를 찾음
  return getFirstDomFromChildren(instance.children);
};

/**
 * 자식 인스턴스들로부터 첫 번째 실제 DOM 노드를 찾습니다.
 */
export const getFirstDomFromChildren = (children: (Instance | null)[]): HTMLElement | Text | null => {
  // 자식들을 순회하며 첫 번째 DOM 노드를 찾음
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
  // 인스턴스가 null이면 아무것도 하지 않음
  if (!instance) {
    return;
  }

  // 인스턴스의 모든 DOM 노드들을 가져옴
  const domNodes = getDomNodes(instance);

  // 각 DOM 노드를 부모에 삽입
  for (const node of domNodes) {
    if (anchor) {
      // anchor가 있으면 그 앞에 삽입
      parentDom.insertBefore(node, anchor);
    } else {
      // anchor가 없으면 마지막에 추가
      parentDom.appendChild(node);
    }
  }
};

/**
 * 부모 DOM에서 인스턴스에 해당하는 모든 DOM 노드를 제거합니다.
 */
export const removeInstance = (instance: Instance | null): void => {
  // 인스턴스가 null이면 아무것도 하지 않음
  if (!instance) {
    return;
  }

  // 인스턴스의 모든 DOM 노드들을 가져와서 제거
  const domNodes = getDomNodes(instance);
  for (const node of domNodes) {
    // 부모 노드에서 제거
    node.parentNode?.removeChild(node);
  }
};
