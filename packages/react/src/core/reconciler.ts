import { context } from "./context";
import { Fragment, NodeTypes, TEXT_ELEMENT } from "./constants";
import { Instance, VNode } from "./types";
import { getDomNodes, insertInstance, removeInstance, setDomProps, updateDomProps } from "./dom";
import { createChildPath } from "./elements";

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
  // 여기를 구현하세요.
  // 1. 새 노드가 null이면 기존 인스턴스를 제거합니다. (unmount)
  // 2. 기존 인스턴스가 없으면 새 노드를 마운트합니다. (mount)
  // 3. 타입이나 키가 다르면 기존 인스턴스를 제거하고 새로 마운트합니다.
  // 4. 타입과 키가 같으면 인스턴스를 업데이트합니다. (update)
  //    - DOM 요소: updateDomProps로 속성 업데이트 후 자식 재조정
  //    - 컴포넌트: 컴포넌트 함수 재실행 후 자식 재조정
  if (node == null) {
    if (instance) {
      removeInstance(parentDom, instance);
    }

    return null;
  }

  if (!instance) {
    return mount(parentDom, node, path);
  }

  if (instance.node.type !== node.type || instance.key !== node.key) {
    removeInstance(parentDom, instance);
    return mount(parentDom, node, path);
  }

  return update(parentDom, instance, node, path);
};

/**
 * 새로운 VNode를 마운트합니다.
 */
const mount = (parentDom: HTMLElement, node: VNode, path: string): Instance => {
  const { type, props, key } = node;

  // TEXT 노드
  if (type === TEXT_ELEMENT) {
    const textNode = document.createTextNode(props.nodeValue);
    const instance: Instance = {
      kind: NodeTypes.TEXT,
      dom: textNode,
      node,
      children: [],
      key,
      path,
    };
    parentDom.appendChild(textNode);
    return instance;
  }

  // Fragment
  if (type === Fragment) {
    const instance: Instance = {
      kind: NodeTypes.FRAGMENT,
      dom: null,
      node,
      children: [],
      key,
      path,
    };
    instance.children = reconcileChildren(parentDom, instance, props?.children || [], path);
    return instance;
  }

  // Component (함수)
  if (typeof type === "function") {
    const instance: Instance = {
      kind: NodeTypes.COMPONENT,
      dom: null,
      node,
      children: [],
      key,
      path,
    };

    // 컴포넌트 실행을 위한 훅 컨텍스트 설정
    // 현재 컴포넌트 경로를 훅 스택에 추가
    context.hooks.componentStack.push(path);
    // 이 컴포넌트의 훅 인덱스를 0으로 초기화
    context.hooks.cursor.set(path, 0);
    // 이 컴포넌트를 방문 목록에 추가합니다.
    context.hooks.visited.add(path);

    const childNode = type(props);

    context.hooks.componentStack.pop();

    // 컴포넌트의 결과를 마운트
    const childPath = createChildPath(path, null, 0, childNode?.type, [childNode].filter(Boolean) as VNode[]);
    instance.children = [reconcile(parentDom, null, childNode, childPath)];

    return instance;
  }

  // Host 노드 (일반 HTML 요소)
  const dom = document.createElement(type as string);
  setDomProps(dom, props);

  const instance: Instance = {
    kind: NodeTypes.HOST,
    dom,
    node,
    children: [],
    key,
    path,
  };

  // 자식 마운트 전에 DOM을 추가
  parentDom.appendChild(dom);
  instance.children = reconcileChildren(dom, instance, props?.children || [], path);

  return instance;
};

/**
 * 기존 인스턴스를 업데이트합니다.
 */
const update = (parentDom: HTMLElement, instance: Instance, node: VNode, path: string): Instance => {
  const { type, props } = node;

  // 이전 props 백업
  const prevProps = instance.node.props;

  instance.node = node;

  // TEXT 노드 업데이트
  if (type === TEXT_ELEMENT && instance.dom) {
    if ((instance.dom as Text).nodeValue !== props.nodeValue) {
      (instance.dom as Text).nodeValue = props.nodeValue;
    }
    return instance;
  }

  // Fragment 업데이트
  if (type === Fragment) {
    instance.children = reconcileChildren(parentDom, instance, props?.children || [], path);
    return instance;
  }

  // Component 업데이트
  if (typeof type === "function") {
    // 컴포넌트 실행을 위한 훅 컨텍스트 설정
    context.hooks.componentStack.push(path);
    context.hooks.cursor.set(path, 0);
    context.hooks.visited.add(path);

    const childNode = type(props);

    context.hooks.componentStack.pop();

    // 기존 자식과 비교
    const prevChild = instance.children[0];
    const childPath = createChildPath(path, null, 0, childNode?.type, [childNode].filter(Boolean) as VNode[]);
    instance.children = [reconcile(parentDom, prevChild, childNode, childPath)];

    return instance;
  }

  // Host 노드 업데이트
  if (instance.dom && instance.kind === NodeTypes.HOST) {
    updateDomProps(instance.dom as HTMLElement, prevProps, props);
    instance.children = reconcileChildren(instance.dom as HTMLElement, instance, props?.children || [], path);
  }

  return instance;
};

/**
 * 자식 노드들을 재조정합니다.
 */
const reconcileChildren = (
  parentDom: HTMLElement,
  parentInstance: Instance,
  newChildren: VNode[],
  parentPath: string,
): (Instance | null)[] => {
  const oldChildren = parentInstance.children;
  const resultChildren: (Instance | null)[] = [];

  // key 기반 매핑을 위한 맵 생성
  const oldChildrenByKey = new Map<string | number, Instance>();
  const oldChildrenWithoutKey: Instance[] = [];
  const usedOldChildren = new Set<Instance>();

  for (const oldChild of oldChildren) {
    if (oldChild && oldChild.key != null) {
      oldChildrenByKey.set(oldChild.key, oldChild);
    } else if (oldChild) {
      oldChildrenWithoutKey.push(oldChild);
    }
  }

  let oldChildIndex = 0;

  // 새 자식들을 순회하며 재조정
  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i];
    const newKey = newChild?.key;
    const newType = newChild?.type;

    let oldChild: Instance | null = null;

    // key가 있으면 key로 매칭
    if (newKey != null) {
      oldChild = oldChildrenByKey.get(newKey) || null;
      if (oldChild) {
        oldChildrenByKey.delete(newKey);
        usedOldChildren.add(oldChild);
      }
    } else {
      // key가 없으면 타입으로 매칭
      for (let j = oldChildIndex; j < oldChildrenWithoutKey.length; j++) {
        const candidate = oldChildrenWithoutKey[j];
        if (candidate && candidate.node.type === newType) {
          oldChild = candidate;
          oldChildIndex = j + 1;
          usedOldChildren.add(candidate);
          break;
        }
      }
    }

    const childPath = createChildPath(parentPath, newKey, i, newType, newChildren);
    const newInstance = reconcile(parentDom, oldChild, newChild, childPath);

    resultChildren.push(newInstance);
  }

  // DOM 순서 조정 - 모든 자식을 올바른 순서로 재배치
  let anchor: HTMLElement | Text | null = null;

  // 역순으로 순회하면서 각 인스턴스를 anchor 앞에 삽입
  for (let i = resultChildren.length - 1; i >= 0; i--) {
    const instance = resultChildren[i];
    if (!instance) continue;

    // insertInstance를 사용하여 인스턴스를 올바른 위치에 배치
    insertInstance(parentDom, instance, anchor);

    // 다음 인스턴스를 위한 anchor 업데이트 (현재 인스턴스의 첫 DOM 노드)
    const domNodes = getDomNodes(instance);
    if (domNodes.length > 0) {
      anchor = domNodes[0];
    }
  }

  // 사용되지 않은 이전 자식들 제거
  for (const oldChild of oldChildrenByKey.values()) {
    removeInstance(parentDom, oldChild);
  }

  for (const oldChild of oldChildrenWithoutKey) {
    if (oldChild && !usedOldChildren.has(oldChild)) {
      removeInstance(parentDom, oldChild);
    }
  }

  return resultChildren;
};
