import { runtimeContext } from "./context";
import { Instance, VNode } from "./types";
import { createInstance, getFirstDom } from "./dom";
import { createChildPath } from "./elements";
import { hookManager } from "./hookManager";
import { NodeTypes } from "./constants";

/**
 * 이전 인스턴스와 새로운 VNode를 비교하여 DOM을 업데이트하는 재조정 과정을 수행합니다.
 *
 * @param parentDom - 부모 DOM 요소
 * @param instance - 이전 렌더링의 인스턴스
 * @param node - 새로운 VNode
 * @param path - 현재 노드의 고유 경로
 * @param anchor - 이 노드가 삽입될 위치의 다음 형제 DOM (null이면 마지막에 추가)
 * @returns 업데이트되거나 새로 생성된 인스턴스
 */
export const reconcile = (
  parentDom: HTMLElement,
  instance: Instance | null,
  node: VNode | null,
  path: string,
  anchor: HTMLElement | Text | null = null,
): Instance | null => {
  // 1. Unmount
  if (!node) {
    if (instance) handleUnmount(parentDom, instance);
    return null;
  }

  // 2. Mount
  if (!instance) {
    return handleMount(parentDom, node, path, anchor);
  }

  // 3. Replace
  if (instance.node.type !== node.type || instance.key !== node.key) {
    return handleReplace(parentDom, instance, node, path, anchor);
  }

  // 4. Update
  return handleUpdate(parentDom, instance, node, path, anchor);
};

const handleUnmount = (parentDom: HTMLElement, instance: Instance) => {
  runtimeContext.workQueue.domMutations.push({ type: "REMOVE", instance, parentDOM: parentDom });
};

const handleMount = (
  parentDom: HTMLElement,
  node: VNode,
  path: string,
  anchor: HTMLElement | Text | null,
): Instance => {
  const newInstance = createInstance(node, path);
  runtimeContext.workQueue.domMutations.push({ type: "INSERT", instance: newInstance, parentDOM: parentDom, anchor });
  return newInstance;
};

const handleReplace = (
  parentDom: HTMLElement,
  instance: Instance,
  node: VNode,
  path: string,
  anchor: HTMLElement | Text | null,
): Instance => {
  handleUnmount(parentDom, instance);
  const newPath = createChildPath(path, node.key, 0, node.type);
  return handleMount(parentDom, node, newPath, anchor);
};

const handleUpdate = (
  parentDom: HTMLElement,
  instance: Instance,
  node: VNode,
  path: string,
  anchor: HTMLElement | Text | null,
): Instance => {
  const prevProps = instance.node.props;
  instance.node = node;

  if (!instance.key) {
    instance.path = path;
  }

  // 1. Props Update
  if (instance.kind === NodeTypes.TEXT && instance.dom instanceof Text) {
    const nextText = node.props.nodeValue as string;
    if (instance.dom.nodeValue !== nextText) {
      runtimeContext.workQueue.domMutations.push({
        type: "UPDATE_TEXT",
        dom: instance.dom,
        prevText: instance.dom.nodeValue || "",
        nextText,
      });
    }
  } else if (instance.kind === NodeTypes.HOST && instance.dom instanceof HTMLElement) {
    if (prevProps !== node.props) {
      runtimeContext.workQueue.domMutations.push({
        type: "UPDATE_PROPS",
        dom: instance.dom,
        prevProps,
        nextProps: node.props,
      });
    }
  }

  // 2. Children Reconcile
  updateChildren(parentDom, instance, node, instance.path);

  // 3. Reordering (position correction)
  runtimeContext.workQueue.domMutations.push({
    type: "INSERT",
    instance,
    parentDOM: parentDom,
    anchor,
  });

  return instance;
};

const updateChildren = (parentDom: HTMLElement, instance: Instance, node: VNode, path: string) => {
  let nextChildrenVNodes: VNode[] = [];

  if (instance.kind === NodeTypes.COMPONENT) {
    const Component = node.type as React.ComponentType;
    const renderedNode = hookManager.runComponent(path, Component, node.props);
    nextChildrenVNodes = renderedNode ? [renderedNode] : [];
  } else {
    nextChildrenVNodes = node.props.children ?? [];
  }

  const childParentDom = instance.kind === NodeTypes.HOST ? (instance.dom as HTMLElement) : parentDom;

  instance.children = reconcileChildren(childParentDom, instance.children as Instance[], nextChildrenVNodes, path);
};

const reconcileChildren = (
  parentDom: HTMLElement,
  oldChildren: Instance[],
  newVNodes: VNode[],
  parentPath: string,
): Instance[] => {
  const oldChildrenMap = new Map<string, Instance>();
  oldChildren.forEach((child) => {
    if (child.key) oldChildrenMap.set(child.key, child);
  });

  const usedOldChildren = new Set<Instance>();

  const newChildren = newVNodes.map((node, index) => {
    const childPath = createChildPath(parentPath, node.key, index, node.type, newVNodes);
    let oldChild: Instance | null = null;

    if (node.key) {
      oldChild = oldChildrenMap.get(node.key) ?? null;
    } else {
      const candidate = oldChildren[index];
      if (candidate && candidate.node.type === node.type) {
        oldChild = candidate;
      } else {
        oldChild = oldChildren.find((c) => !usedOldChildren.has(c) && c.node.type === node.type) ?? null;
      }
    }

    if (oldChild) usedOldChildren.add(oldChild);
    return { node, childPath, oldChild };
  });

  let anchor: HTMLElement | Text | null = null;
  const reconciledChildren: Instance[] = [];

  for (let i = newChildren.length - 1; i >= 0; i--) {
    const { node, childPath, oldChild } = newChildren[i];
    const reconciledChild = reconcile(parentDom, oldChild, node, childPath, anchor);

    if (reconciledChild) {
      reconciledChildren.unshift(reconciledChild);
      const childDom = getFirstDom(reconciledChild);
      if (childDom) anchor = childDom;
    }
  }

  oldChildren.forEach((oldChild) => {
    if (!usedOldChildren.has(oldChild)) {
      handleUnmount(parentDom, oldChild);
    }
  });

  return reconciledChildren;
};
