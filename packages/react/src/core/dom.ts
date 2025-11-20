/* eslint-disable @typescript-eslint/no-explicit-any */
import { NodeType, NodeTypes, TEXT_ELEMENT, Fragment } from "./constants";
import { Instance, VNode } from "./types";

/**
 * DOM 요소에 속성(props)을 설정합니다.
 * 이벤트 핸들러, 스타일, className 등 다양한 속성을 처리해야 합니다.
 */
export const setDomProps = (dom: HTMLElement, props: Record<string, any>): void => {
  Object.keys(props).forEach((key) => {
    if (key === "children") return;
    if (key === "className") {
      dom.className = props[key];
    } else if (key.startsWith("on")) {
      // 이벤트
    } else {
      // style도 해야하나?
      dom.setAttribute(key, props[key]);
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
  if (!dom || !(dom instanceof HTMLElement)) {
    return;
  }

  Object.keys(nextProps).forEach((key) => {
    if (key === "children") return;

    if (prevProps[key] !== nextProps[key]) {
      if (key === "className") {
        dom.className = nextProps[key];
      } else if (key.startsWith("on")) {
        // 이벤트 핸들러 처리
      } else if (key === "style") {
        // style 객체 처리
      } else {
        dom.setAttribute(key, nextProps[key]);
      }
    }
  });

  Object.keys(prevProps).forEach((key) => {
    if (key === "children") return;

    if (!nextProps[key]) {
      if (key === "className") {
        dom.className = "";
      } else if (key.startsWith("on")) {
        // 이벤트 핸들러 제거
      } else if (key === "style") {
        // style 초기화
      } else {
        dom.removeAttribute(key);
      }
    }
  });
};

/**
 * 주어진 인스턴스에서 실제 DOM 노드(들)를 재귀적으로 찾아 배열로 반환합니다.
 * Fragment나 컴포넌트 인스턴스는 여러 개의 DOM 노드를 가질 수 있습니다.
 */
export const getDomNodes = (instance: Instance | null): (HTMLElement | Text)[] => {
  if (!instance) return [];
  if (instance.kind === NodeTypes.TEXT) return [instance.dom as Text];
  if (instance.kind === NodeTypes.FRAGMENT) return instance.children.map((child) => getDomNodes(child)).flat();
  if (instance.kind === NodeTypes.COMPONENT) return instance.children.map((child) => getDomNodes(child)).flat();
  if (instance.kind === NodeTypes.HOST) return [instance.dom as HTMLElement];
  return [];
};

/**
 * 주어진 인스턴스에서 첫 번째 실제 DOM 노드를 찾습니다.
 */
export const getFirstDom = (instance: Instance | null): HTMLElement | Text | null => {
  if (!instance) return null;
  if (instance.kind === NodeTypes.TEXT) return instance.dom as Text;
  if (instance.kind === NodeTypes.FRAGMENT) return instance.children[0]?.dom as HTMLElement | Text | null;
  if (instance.kind === NodeTypes.COMPONENT) return instance.children[0]?.dom as HTMLElement | Text | null;
  if (instance.kind === NodeTypes.HOST) return instance.dom as HTMLElement;
  return null;
};

/**
 * 자식 인스턴스들로부터 첫 번째 실제 DOM 노드를 찾습니다.
 */
export const getFirstDomFromChildren = (children: (Instance | null)[]): HTMLElement | Text | null => {
  // 여기를 구현하세요.
  if (!children.length) return null;
  return getFirstDom(children[0]);
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
  // 여기를 구현하세요.
  if (!instance) return;

  if (instance.kind === NodeTypes.FRAGMENT || instance.kind === NodeTypes.COMPONENT) {
    instance.children.forEach((child) => insertInstance(parentDom, child, anchor));
    return;
  }

  if (!instance.dom) return;

  if (anchor) {
    parentDom.insertBefore(instance.dom as HTMLElement, anchor);
  } else {
    parentDom.appendChild(instance.dom as HTMLElement);
  }

  instance.children.forEach((child) => insertInstance(instance.dom as HTMLElement, child));
};

/**
 * 부모 DOM에서 인스턴스에 해당하는 모든 DOM 노드를 제거합니다.
 */
export const removeInstance = (parentDom: HTMLElement, instance: Instance | null): void => {
  if (!instance) {
    while (parentDom.firstChild) {
      parentDom.removeChild(parentDom.firstChild);
    }
    return;
  }

  if (!instance.dom) {
    instance.children.forEach((child) => removeInstance(parentDom, child));
    return;
  }

  // Real DOM 제거
  if (instance.dom.parentNode === parentDom) {
    parentDom.removeChild(instance.dom);
  }

  // VDOM에서 real dom과 VNode 제거
  instance.dom = null;
  instance.children = [];
};

export const createInstance = (node: VNode): Instance => {
  if (node.type === TEXT_ELEMENT) {
    return {
      kind: NodeTypes.TEXT,
      dom: document.createTextNode((node.props as { nodeValue: string }).nodeValue),
      node,
      children: [],
      key: null,
      path: "",
    };
  }
  if (node.type === Fragment) {
    const instance: Instance = {
      kind: NodeTypes.FRAGMENT,
      dom: null,
      node,
      children: [],
      key: node.key ?? null,
      path: "",
    };

    instance.children =
      node.props.children?.map((child) => createInstance(child)).filter((child) => child !== null) ?? [];

    return instance;
  }
  if (typeof node.type === "function") {
    const instance: Instance = {
      kind: NodeTypes.COMPONENT,
      dom: null,
      node,
      children: [],
      key: node.key ?? null,
      path: "",
    };

    const ComponentFunction = node.type as React.ComponentType<any>;
    const renderedNode = ComponentFunction(node.props);

    console.log("createInstance ComponentFunction", renderedNode);
    if (renderedNode) {
      const childInstance = createInstance(renderedNode);
      if (childInstance) {
        instance.children = [childInstance];
      }
    }

    return instance;
  }

  const dom = document.createElement(node.type as string);
  setDomProps(dom, node.props);

  const instance: Instance = {
    kind: NodeTypes.HOST,
    dom,
    node,
    children: [],
    key: node.key ?? null,
    path: "",
  };

  node.props.children?.forEach((child) => {
    const childInstance = createInstance(child);
    if (childInstance) {
      instance.children.push(childInstance);
    }
  });

  return instance;
};
