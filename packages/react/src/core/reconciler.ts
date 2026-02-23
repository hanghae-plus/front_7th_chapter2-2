import { context } from "./context";
import { Fragment, NodeTypes, TEXT_ELEMENT } from "./constants";
import { Instance, VNode } from "./types";
import { getFirstDom, insertInstance, removeInstance, setDomProps, updateDomProps } from "./dom";
import { createChildPath } from "./elements";

function mount(parentDom: HTMLElement, node: VNode, path: string): Instance {
  if (node.type === TEXT_ELEMENT) {
    const textDom = document.createTextNode(node.props.nodeValue || "");
    parentDom.appendChild(textDom);

    return {
      kind: NodeTypes.TEXT,
      dom: textDom,
      node,
      children: [],
      key: node.key,
      path,
    };
  }

  if (node.type === Fragment) {
    const nextChildren = node.props.children || [];
    const children = reconcileChildren(parentDom, [], nextChildren, path);

    return {
      kind: NodeTypes.FRAGMENT,
      dom: null,
      node,
      children,
      key: node.key,
      path,
    };
  }

  if (typeof node.type === "function") {
    return mountComponent(parentDom, node, path);
  }

  const dom = document.createElement(node.type as string);
  setDomProps(dom, node.props);
  parentDom.appendChild(dom);

  const childrenInstances = reconcileChildren(dom, [], node.props.children || [], path);

  return {
    kind: NodeTypes.HOST,
    dom,
    node,
    children: childrenInstances,
    key: node.key,
    path,
  };
}

function update(parentDom: HTMLElement, instance: Instance, node: VNode, path: string): Instance {
  if (node.type === TEXT_ELEMENT) {
    const textDom = instance.dom as Text;
    if (textDom.nodeValue !== node.props.nodeValue) {
      textDom.nodeValue = node.props.nodeValue;
    }
    return { ...instance, node };
  }

  if (node.type === Fragment) {
    const nextChildren = node.props.children || [];
    const children = reconcileChildren(parentDom, instance.children, nextChildren, path);
    return { ...instance, node, children };
  }

  if (typeof node.type === "function") {
    return updateComponent(parentDom, instance, node, path);
  }

  const dom = instance.dom as HTMLElement;
  updateDomProps(dom, instance.node.props, node.props);

  const nextChildren = node.props.children || [];
  const updatedChildren = reconcileChildren(dom, instance.children, nextChildren, path);

  return {
    ...instance,
    node,
    children: updatedChildren,
  };
}

/**
 * 이전 인스턴스와 새로운 VNode를 비교하여 DOM을 업데이트하는 재조정 과정을 수행합니다.
 *
 * @param parentDom - 부모 DOM 요소
 * @param instance - 이전 렌더링의 인스턴스
 * @param node - 새로운 VNode
 * @param path - 현재 노드의 고유 경로
 * @returns 업데이트되거나 새로 생성된 인스턴스
 */
export const reconcile = (
  parentDom: HTMLElement,
  instance: Instance | null,
  node: VNode | null,
  path: string,
): Instance | null => {
  // 1. 새 노드가 null이면 기존 인스턴스 제거 (unmount)
  if (!node) {
    if (instance) removeInstance(parentDom, instance);
    return null;
  }

  // 2. 기존 인스턴스가 없으면 새로 마운트 (mount)
  if (!instance) {
    return mount(parentDom, node, path);
  }

  // 3. 타입 또는 key가 다르면 전체 교체
  if (instance.node.type !== node.type || instance.key !== node.key) {
    removeInstance(parentDom, instance);
    return mount(parentDom, node, path);
  }

  // 4. 같은 타입이면 update 진행
  return update(parentDom, instance, node, path);
};

function reconcileChildren(
  parentDom: HTMLElement,
  prevChildren: (Instance | null)[],
  nextChildren: VNode[],
  parentPath: string,
): Instance[] {
  const nextInstances: Instance[] = [];
  const prevKeyed = new Map<string | null, Instance>();
  const prevUnkeyed: Instance[] = [];

  for (const child of prevChildren) {
    if (!child) continue;
    if (child.key != null) {
      prevKeyed.set(child.key, child);
    } else {
      prevUnkeyed.push(child);
    }
  }

  nextChildren.forEach((child, index) => {
    const childPath = createChildPath(parentPath, child.key, index, child.type, nextChildren);
    let matched: Instance | null = null;

    if (child.key != null && prevKeyed.has(child.key)) {
      matched = prevKeyed.get(child.key) ?? null;
      prevKeyed.delete(child.key);
    } else if (child.key == null && prevUnkeyed.length) {
      matched = prevUnkeyed.shift() ?? null;
    }

    const updated = reconcile(parentDom, matched, child, childPath);
    if (updated) {
      nextInstances.push(updated);
    }
  });

  prevKeyed.forEach((instance) => removeInstance(parentDom, instance));
  prevUnkeyed.forEach((instance) => removeInstance(parentDom, instance));

  reorderInstances(parentDom, nextInstances);

  return nextInstances;
}

function reorderInstances(parentDom: HTMLElement, instances: Instance[]) {
  let anchor: HTMLElement | Text | null = null;
  for (let i = instances.length - 1; i >= 0; i -= 1) {
    insertInstance(parentDom, instances[i], anchor);
    const firstDom = getFirstDom(instances[i]);
    anchor = firstDom ?? anchor;
  }
}

function mountComponent(parentDom: HTMLElement, node: VNode, path: string): Instance {
  const rendered = renderComponent(node, path);
  const childInstance = rendered ? mountChild(parentDom, rendered, path) : null;

  return {
    kind: NodeTypes.COMPONENT,
    dom: getFirstDom(childInstance),
    node,
    children: childInstance ? [childInstance] : [],
    key: node.key,
    path,
  };
}

function updateComponent(parentDom: HTMLElement, instance: Instance, node: VNode, path: string): Instance {
  const rendered = renderComponent(node, path);
  const prevChild = instance.children[0] ?? null;
  let childInstance: Instance | null = null;

  if (rendered) {
    childInstance = reconcile(
      parentDom,
      prevChild,
      rendered,
      createChildPath(path, rendered.key, 0, rendered.type, [rendered]),
    );
  } else if (prevChild) {
    removeInstance(parentDom, prevChild);
    childInstance = null;
  }

  return {
    kind: NodeTypes.COMPONENT,
    dom: getFirstDom(childInstance),
    node,
    children: childInstance ? [childInstance] : [],
    key: node.key,
    path,
  };
}

function renderComponent(node: VNode, path: string): VNode | null {
  const Component = node.type as React.ComponentType;
  const { hooks } = context;

  // 컴포넌트 스택에 현재 경로 추가 (훅 호출 전에 설정되어야 함)
  hooks.componentStack.push(path);
  hooks.visited.add(path);

  // 커서 초기화
  hooks.cursor.set(path, 0);

  // 훅 상태 배열 초기화 (없는 경우만)
  if (!hooks.state.has(path)) {
    hooks.state.set(path, []);
  }

  try {
    return Component(node.props ?? {});
  } catch (error) {
    // 에러 발생 시 빈 div를 반환하여 컴포넌트를 렌더링하되 내용은 비워둠
    // 에러는 개발 환경에서만 로깅
    if (process.env.NODE_ENV !== "production") {
      console.error("Error rendering component:", error);
    }
    // 빈 div를 반환하여 무한 루프 방지
    return {
      type: "div",
      key: null,
      props: {},
    };
  } finally {
    // 컴포넌트 스택에서 제거
    hooks.componentStack.pop();
  }
}

function mountChild(parentDom: HTMLElement, child: VNode, parentPath: string): Instance | null {
  const path = createChildPath(parentPath, child.key, 0, child.type, [child]);
  return reconcile(parentDom, null, child, path);
}
