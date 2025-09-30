import { context } from "./context";
import { Fragment, NodeTypes, TEXT_ELEMENT } from "./constants";
import { Instance, VNode } from "./types";
import {
  getFirstDom,
  getFirstDomFromChildren,
  insertInstance,
  removeInstance,
  setDomProps,
  updateDomProps,
} from "./dom";
import { createChildPath } from "./elements";
import { isEmptyValue } from "../utils";

const renderComponent = (node: VNode, path: string): VNode | null => {
  context.hooks.visited.add(path);
  context.hooks.cursor.set(path, 0);
  context.hooks.componentStack.push(path);
  let rendered: VNode | null;
  try {
    rendered = (node.type as React.ComponentType)(node.props) || null;
  } finally {
    context.hooks.componentStack.pop();
  }
  return rendered;
};

const mountHost = (node: VNode, path: string): Instance => {
  const dom = document.createElement(node.type as string);
  setDomProps(dom, node.props);

  return {
    kind: NodeTypes.HOST,
    dom,
    node,
    children:
      node.props?.children?.map((child, index) => {
        const childPath = createChildPath(path, child?.key, index, child?.type, node.props.children || []);
        const childInstance = mount(child, childPath);
        insertInstance(dom, childInstance);
        return childInstance;
      }) ?? [],
    key: node.key ?? null,
    path,
  };
};

const mountText = (node: VNode, path: string): Instance => {
  const dom = document.createTextNode(node.props.nodeValue);
  return {
    kind: NodeTypes.TEXT,
    dom,
    node,
    children: [],
    key: node.key ?? null,
    path,
  };
};

const mountFragment = (node: VNode, path: string): Instance => {
  const children =
    node.props?.children?.map((child, index) =>
      mount(child, createChildPath(path, child?.key, index, child?.type, node.props.children || [])),
    ) ?? [];
  return {
    kind: NodeTypes.FRAGMENT,
    dom: getFirstDomFromChildren(children),
    node,
    children,
    key: node.key ?? null,
    path,
  };
};

const mountComponent = (node: VNode, path: string): Instance => {
  const rendered = renderComponent(node, path);
  const childPath = createChildPath(path, null, 0, rendered?.type);
  const childInstance = mount(rendered, childPath);
  const children = childInstance ? [childInstance] : [];
  return {
    kind: NodeTypes.COMPONENT,
    dom: getFirstDom(childInstance),
    node,
    children,
    key: node.key ?? null,
    path,
  };
};

const mount = (node: VNode | null, path: string): Instance | null => {
  if (isEmptyValue(node)) {
    return null;
  }

  if (typeof node.type === "function") {
    return mountComponent(node, path);
  }

  if (node.type === Fragment) {
    return mountFragment(node, path);
  }

  if (node.type === TEXT_ELEMENT) {
    return mountText(node, path);
  }

  return mountHost(node, path);
};

const canReuseInstance = (prevNode: VNode | null, node: VNode | null): boolean =>
  !!prevNode && !!node && Object.is(prevNode.type, node.type) && Object.is(prevNode.key ?? null, node.key ?? null);

const findReusableUnkeyed = (candidates: Instance[], nextNode: VNode): number =>
  candidates.findLastIndex((candidate) => canReuseInstance(candidate?.node, nextNode));

const reconcileComponent = (parentDom: HTMLElement, instance: Instance, node: VNode, path: string): Instance => {
  const previousChild = instance.children[0] ?? null;
  const rendered = renderComponent(node, path);
  const childPath = createChildPath(path, null, 0, rendered?.type);
  const child = reconcile(parentDom, previousChild, rendered, childPath);
  return Object.assign(instance, {
    children: child ? [child] : [],
    dom: getFirstDom(child),
    key: node.key ?? null,
    node,
  });
};

const isInstance = (instance: Instance | null): instance is Instance => instance !== null;
const reconcileChildren = (
  parentDom: HTMLElement,
  prevChildren: (Instance | null)[],
  nextChildren: VNode[],
  parentPath: string,
): (Instance | null)[] => {
  const unkeyedPrev = prevChildren?.filter(isInstance).filter((child) => child.node?.key === null) ?? [];
  const keyedPrev = new Map(
    prevChildren
      ?.filter(isInstance)
      .filter((child) => !unkeyedPrev.includes(child))
      .map((child) => [child.key, child]),
  );

  const getPrevInstanceByKey = (key: string): Instance | undefined => {
    const value = keyedPrev.get(key);
    if (value) {
      keyedPrev.delete(key);
    }
    return value;
  };

  const getPrevInstanceByNode = (
    nextNode: VNode,
    matchIndex = findReusableUnkeyed(unkeyedPrev, nextNode),
  ): Instance | undefined => (matchIndex >= 0 ? unkeyedPrev.splice(matchIndex, 1)[0] : unkeyedPrev.pop());

  const getPrevInstance = (nextNode: VNode): Instance | null => {
    const key = nextNode?.key ?? null;

    if (key !== null) {
      return getPrevInstanceByKey(key) ?? null;
    }

    return unkeyedPrev.length > 0 ? (getPrevInstanceByNode(nextNode) ?? null) : null;
  };

  let anchor: HTMLElement | Text | null = null;
  const getNextInstance = (nextNode: VNode, childPath: string): Instance | null => {
    const childInstance = reconcile(parentDom, getPrevInstance(nextNode), nextNode, childPath);
    if (childInstance) {
      insertInstance(parentDom, childInstance, anchor);
      const nextChild = getFirstDom(childInstance);
      if (nextChild) {
        anchor = nextChild;
      }
    }
    return childInstance;
  };

  const nextInstances: (Instance | null)[] = [];
  for (let i = nextChildren.length - 1; i >= 0; i -= 1) {
    const nextNode = nextChildren[i];
    nextInstances[i] = nextNode
      ? getNextInstance(nextNode, createChildPath(parentPath, nextNode.key, i, nextNode.type, nextChildren))
      : null;
  }

  Array.from(keyedPrev.values())
    .concat(unkeyedPrev)
    .forEach((instance) => removeInstance(parentDom, instance));

  return nextInstances;
};

const reconcileFragment = (parentDom: HTMLElement, instance: Instance, node: VNode, path: string): Instance => {
  const children = reconcileChildren(parentDom, instance.children ?? [], node.props.children ?? [], path);
  return Object.assign(instance, {
    children,
    dom: getFirstDomFromChildren(children),
    node,
    key: node.key ?? null,
  });
};

export const reconcile = (
  parentDom: HTMLElement,
  instance: Instance | null,
  node: VNode | null,
  path: string,
): Instance | null => {
  if (node === null) {
    removeInstance(parentDom, instance);
    return null;
  }

  if (!instance) {
    return mount(node, path);
  }

  if (node.type !== instance.node.type || !Object.is(node.key, instance.node.key)) {
    removeInstance(parentDom, instance);
    return mount(node, path);
  }

  if (typeof node.type === "function") {
    return reconcileComponent(parentDom, instance, node, path);
  }

  if (node.type === Fragment) {
    return reconcileFragment(parentDom, instance, node, path);
  }

  if (node.type === TEXT_ELEMENT) {
    if ((instance.dom as Text).nodeValue !== node.props.nodeValue) {
      (instance.dom as Text).nodeValue = node.props.nodeValue;
    }
    instance.node = node;
    instance.key = node.key ?? null;
    return instance;
  }

  updateDomProps(instance.dom as HTMLElement, instance.node.props, node.props);
  instance.children = reconcileChildren(
    instance.dom as HTMLElement,
    instance.children ?? [],
    node.props?.children ?? [],
    path,
  );
  instance.node = node;
  instance.key = node.key ?? null;
  return instance;
};
