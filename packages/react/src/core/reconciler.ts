import { context } from "./context";
import { Fragment, NodeTypes, TEXT_ELEMENT } from "./constants";
import { Instance, VNode } from "./types";
import {
  // getDomNodes,
  // getFirstDom,
  // getFirstDomFromChildren,
  insertInstance,
  removeInstance,
  setDomProps,
  updateDomProps,
} from "./dom";
import { createChildPath } from "./elements";
// import { isEmptyValue } from "../utils";

function reconcileChildren(
  parentDom: HTMLElement,
  oldChildren: (Instance | null)[],
  newChildren: VNode[],
  parentPath: string,
): (Instance | null)[] {
  const newInstances: (Instance | null)[] = [];
  const maxLength = Math.max(oldChildren.length, newChildren.length);

  for (let i = 0; i < maxLength; i++) {
    const oldChild = oldChildren[i] || null;
    const newChild = newChildren[i] || null;

    const childPath = newChild
      ? createChildPath(parentPath, newChild.key, i, newChild.type, newChildren)
      : oldChild?.path || `${parentPath}.i${i}`;

    const newInstance = reconcile(parentDom, oldChild, newChild, childPath);
    newInstances.push(newInstance);
  }

  return newInstances.filter((inst): inst is Instance => inst !== null);
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
  // 1. 새 노드가 null이면 기존 인스턴스를 제거합니다. (unmount)
  if (!node) {
    if (instance) removeInstance(parentDom, instance);
    return null;
  }

  // 2. 기존 인스턴스가 없으면 새 노드를 마운트합니다. (mount)
  if (!instance) {
    if (node.type === TEXT_ELEMENT) {
      const textNode = document.createTextNode(node.props.nodeValue || "");
      parentDom.appendChild(textNode);

      return {
        kind: NodeTypes.TEXT,
        dom: textNode,
        node,
        children: [],
        key: node.key,
        path,
      };
    }

    if (node.type === Fragment) {
      const children = node.props.children || [];
      const childInstances = children.map((child, index) => {
        const childPath = createChildPath(path, child.key, index, child.type, children);
        return reconcile(parentDom, null, child, childPath);
      });

      return {
        kind: NodeTypes.FRAGMENT,
        dom: null,
        node,
        children: childInstances,
        key: node.key,
        path,
      };
    }

    // 2-3. 함수 컴포넌트
    if (typeof node.type === "function") {
      context.hooks.componentStack.push(path);
      context.hooks.visited.add(path);
      context.hooks.cursor.set(path, 0);

      let childNode: VNode | null = null;
      try {
        childNode = node.type(node.props);
      } finally {
        context.hooks.componentStack.pop();
      }

      const childPath =
        childNode && typeof childNode.type === "function"
          ? createChildPath(path, childNode.key, 0, childNode.type, [childNode])
          : path;

      const childInstance = reconcile(parentDom, null, childNode, childPath);
      // const childInstance = reconcile(parentDom, null, childNode, path);

      return {
        kind: NodeTypes.COMPONENT,
        dom: null,
        node,
        children: childInstance ? [childInstance] : [],
        key: node.key,
        path,
      };
    }

    const element = document.createElement(node.type as string);
    setDomProps(element, node.props);

    const children = node.props.children || [];
    const childInstances = children.map((child, index) => {
      const childPath = createChildPath(path, child.key, index, child.type, children);
      return reconcile(element, null, child, childPath);
    });

    const newInstance: Instance = {
      kind: NodeTypes.HOST,
      dom: element,
      node,
      children: childInstances,
      key: node.key,
      path,
    };

    insertInstance(parentDom, newInstance);

    return newInstance;
  }

  // 3. 타입이나 키가 다르면 기존 인스턴스를 제거하고 새로 마운트합니다.
  if (instance.node.type !== node.type || instance.key !== node.key) {
    removeInstance(parentDom, instance);
    return reconcile(parentDom, null, node, path);
  }

  // 4. 타입과 키가 같으면 인스턴스를 업데이트합니다. (update)
  //    - DOM 요소: updateDomProps로 속성 업데이트 후 자식 재조정
  //    - 컴포넌트: 컴포넌트 함수 재실행 후 자식 재조정
  if (node.type === TEXT_ELEMENT) {
    const textNode = instance.dom as Text;
    if (textNode.nodeValue !== node.props.nodeValue) {
      textNode.nodeValue = node.props.nodeValue || "";
    }
    return {
      ...instance,
      node,
    };
  }

  if (node.type === Fragment) {
    const children = node.props.children || [];
    const childInstances = reconcileChildren(parentDom, instance.children, children, path);

    return {
      ...instance,
      node,
      children: childInstances,
    };
  }

  if (typeof node.type === "function") {
    context.hooks.componentStack.push(path);
    context.hooks.visited.add(path);
    context.hooks.cursor.set(path, 0);

    let childNode: VNode | null = null;
    try {
      childNode = node.type(node.props);
    } finally {
      context.hooks.componentStack.pop();
    }

    const childPath =
      childNode && typeof childNode.type === "function"
        ? createChildPath(path, childNode.key, 0, childNode.type, [childNode])
        : path;

    const childInstance = reconcile(parentDom, instance.children[0] || null, childNode, childPath);

    return {
      ...instance,
      node,
      children: childInstance ? [childInstance] : [],
    };
  }

  const element = instance.dom as HTMLElement;
  updateDomProps(element, instance.node.props, node.props);

  const children = node.props.children || [];
  const childInstances = reconcileChildren(element, instance.children, children, path);

  return {
    ...instance,
    node,
    children: childInstances,
  };
};
