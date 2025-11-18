import { isEmptyValue } from "../utils";
import { Fragment, NodeTypes, TEXT_ELEMENT } from "./constants";
import { context } from "./context";
import {
  getFirstDom,
  getFirstDomFromChildren,
  insertInstance,
  removeInstance,
  setDomProps,
  updateDomProps,
} from "./dom";
import { createChildPath } from "./elements";
import { Instance, VNode } from "./types";

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
  if (node === null) {
    if (instance) removeInstance(parentDom, instance);
    return null;
  }

  // 2. 기존 인스턴스가 없으면 새 노드를 마운트합니다. (mount)
  if (!instance) return mountNode(parentDom, node, path);

  // 3. 타입이나 키가 다르면 기존 인스턴스를 제거하고 새로 마운트합니다.
  if (instance.node.type !== node.type || !Object.is(instance.key ?? null, node.key ?? null)) {
    removeInstance(parentDom, instance);
    return mountNode(parentDom, node, path);
  }

  // 4. 타입과 키가 같으면 인스턴스를 업데이트합니다. (update)
  return updateInstance(parentDom, instance, node, path);
};

/**
 * 새로운 노드를 마운트합니다.
 */
const mountNode = (parentDom: HTMLElement, node: VNode, path: string): Instance => {
  const { type } = node;

  // TEXT 노드
  if (type === TEXT_ELEMENT) {
    const dom = document.createTextNode(node.props?.nodeValue ?? "");
    const instance: Instance = {
      kind: NodeTypes.TEXT,
      dom,
      node,
      children: [],
      key: node.key,
      path,
    };
    parentDom.appendChild(dom);
    return instance;
  }

  // Fragment
  if (type === Fragment) {
    const children = (node.props?.children ?? []).filter((child) => !isEmptyValue(child));
    const childInstances: (Instance | null)[] = [];

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childPath = createChildPath(path, child.key, i, child.type, children);
      const childInstance = reconcile(parentDom, null, child, childPath);
      childInstances.push(childInstance);
    }

    const instance: Instance = {
      kind: NodeTypes.FRAGMENT,
      dom: getFirstDomFromChildren(childInstances),
      node,
      children: childInstances,
      key: node.key,
      path,
    };

    return instance;
  }

  // 함수 컴포넌트
  if (typeof type === "function") return mountComponent(parentDom, node, path);

  // HOST (DOM 요소)
  const dom = document.createElement(type as string);
  setDomProps(dom, node.props);

  const children = (node.props?.children ?? []).filter((child) => !isEmptyValue(child));
  const childInstances: (Instance | null)[] = [];

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const childPath = createChildPath(path, child.key, i, child.type, children);
    const childInstance = reconcile(dom, null, child, childPath);

    if (childInstance) insertInstance(dom, childInstance);
    childInstances.push(childInstance);
  }

  parentDom.appendChild(dom);

  const instance: Instance = {
    kind: NodeTypes.HOST,
    dom,
    node,
    children: childInstances,
    key: node.key,
    path,
  };

  return instance;
};

/**
 * 함수 컴포넌트를 마운트합니다.
 */
const mountComponent = (parentDom: HTMLElement, node: VNode, path: string): Instance => {
  const { type, props } = node;
  const component = type as React.ComponentType;

  // 훅 컨텍스트 설정
  context.hooks.componentStack.push(path);
  context.hooks.cursor.set(path, 0);
  context.hooks.visited.add(path);

  try {
    // 컴포넌트 함수 실행
    const childNode = component(props ?? {});

    // 자식 노드 마운트
    const childPath = createChildPath(path, childNode?.key ?? null, 0, childNode?.type, childNode ? [childNode] : []);
    const childInstance = reconcile(parentDom, null, childNode, childPath);

    const instance: Instance = {
      kind: NodeTypes.COMPONENT,
      dom: getFirstDom(childInstance),
      node,
      children: childInstance ? [childInstance] : [],
      key: node.key,
      path,
    };

    return instance;
  } finally {
    // 훅 컨텍스트 정리
    context.hooks.componentStack.pop();
  }
};

/**
 * 기존 인스턴스를 업데이트합니다.
 */
const updateInstance = (parentDom: HTMLElement, instance: Instance, node: VNode, path: string): Instance => {
  const { kind } = instance;

  // TEXT 노드 업데이트
  if (kind === NodeTypes.TEXT) {
    const newValue = node.props?.nodeValue ?? "";
    if (instance.dom && instance.dom.nodeValue !== newValue) instance.dom.nodeValue = newValue;
    instance.node = node;
    return instance;
  }

  // Fragment 업데이트
  if (kind === NodeTypes.FRAGMENT) {
    reconcileChildren(parentDom, instance, node, path);
    instance.dom = getFirstDomFromChildren(instance.children);
    instance.node = node;
    return instance;
  }

  // 함수 컴포넌트 업데이트
  if (kind === NodeTypes.COMPONENT) return updateComponent(parentDom, instance, node, path);

  // HOST (DOM 요소) 업데이트
  updateDomProps(instance.dom as HTMLElement, instance.node.props ?? {}, node.props ?? {});
  reconcileChildren(instance.dom as HTMLElement, instance, node, path);
  instance.node = node;

  return instance;
};

/**
 * 함수 컴포넌트를 업데이트합니다.
 */
const updateComponent = (parentDom: HTMLElement, instance: Instance, node: VNode, path: string): Instance => {
  const { type, props } = node;
  const component = type as React.ComponentType;

  // 훅 컨텍스트 복원
  context.hooks.componentStack.push(path);
  context.hooks.cursor.set(path, 0);
  context.hooks.visited.add(path);

  try {
    // 컴포넌트 함수 재실행
    const childNode = component(props ?? {});

    // 자식 노드 재조정
    const oldChildInstance = instance.children[0] ?? null;
    const childPath = createChildPath(path, childNode?.key ?? null, 0, childNode?.type, childNode ? [childNode] : []);
    const newChildInstance = reconcile(parentDom, oldChildInstance, childNode, childPath);

    instance.dom = getFirstDom(newChildInstance);
    instance.children = newChildInstance ? [newChildInstance] : [];
    instance.node = node;

    return instance;
  } finally {
    // 훅 컨텍스트 정리
    context.hooks.componentStack.pop();
  }
};

/**
 * 자식 노드들을 재조정합니다.
 */
const reconcileChildren = (parentDom: HTMLElement, instance: Instance, node: VNode, path: string): void => {
  const oldChildren = instance.children;
  const newChildren = node.props?.children ?? [];

  // key 기반 맵 생성
  const keyMap = new Map<string | null, Instance>();
  const keylessOldChildren: Instance[] = [];

  for (const oldChild of oldChildren) {
    if (!oldChild) continue;
    if (oldChild.key != null) keyMap.set(oldChild.key, oldChild);
    else keylessOldChildren.push(oldChild);
  }

  const newChildInstances: (Instance | null)[] = [];
  const usedOldInstances = new Set<Instance>();

  // 새로운 자식들을 순회하며 매칭
  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i];
    const childPath = createChildPath(path, newChild.key, i, newChild.type, newChildren);

    let matchedInstance: Instance | null = null;

    // key로 매칭 시도
    if (newChild.key != null) {
      matchedInstance = keyMap.get(newChild.key) ?? null;
      if (matchedInstance) usedOldInstances.add(matchedInstance);
    }

    // key 매칭 실패 시 타입과 위치로 매칭 시도
    if (!matchedInstance) {
      for (const oldChild of keylessOldChildren) {
        if (usedOldInstances.has(oldChild)) continue;
        if (oldChild.node.type === newChild.type) {
          matchedInstance = oldChild;
          usedOldInstances.add(oldChild);
          break;
        }
      }
    }

    // 재조정
    const newChildInstance = reconcile(parentDom, matchedInstance, newChild, childPath);
    newChildInstances.push(newChildInstance);
  }

  // 사용되지 않은 기존 자식들 제거
  for (const oldChild of oldChildren) {
    if (oldChild && !usedOldInstances.has(oldChild)) removeInstance(parentDom, oldChild);
  }

  // 역순으로 DOM 재배치
  let anchor: HTMLElement | Text | null = null;
  for (let i = newChildInstances.length - 1; i >= 0; i--) {
    const newChildInstance = newChildInstances[i];

    if (newChildInstance) {
      const firstDom = getFirstDom(newChildInstance);
      if (firstDom) {
        insertInstance(parentDom, newChildInstance, anchor);
        anchor = firstDom;
      }
    }
  }

  instance.children = newChildInstances;
};
