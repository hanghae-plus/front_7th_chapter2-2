import { context } from "./context";
import { Fragment, NodeTypes, TEXT_ELEMENT } from "./constants";
import { Instance, VNode } from "./types";
import { getFirstDom, insertInstance, removeInstance, setDomProps, updateDomProps } from "./dom";
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
  // 1. 새 노드가 null이면 언마운트
  if (node === null) {
    if (instance) {
      unmount(parentDom, instance);
    }
    return null;
  }

  // 2. 기존 인스턴스가 없으면 새로 마운트
  if (!instance) {
    return mount(parentDom, node, path);
  }

  // 3. 타입이나 키가 다르면 교체 (언마운트 후 마운트)
  if (instance.node.type !== node.type || instance.key !== node.key) {
    unmount(parentDom, instance);
    return mount(parentDom, node, path);
  }

  // 4. 같은 타입이면 업데이트
  return update(parentDom, instance, node, path);
};

/**
 * 새로운 VNode를 DOM에 마운트합니다.
 */
const mount = (parentDom: HTMLElement, node: VNode, path: string): Instance => {
  const { type } = node;

  // 컴포넌트
  if (typeof type === "function") {
    return mountComponent(parentDom, node, path);
  }

  // Fragment
  if (type === Fragment) {
    return mountFragment(parentDom, node, path);
  }

  // 텍스트 노드
  if (type === TEXT_ELEMENT) {
    return mountText(parentDom, node, path);
  }

  // HOST 노드 (일반 HTML 요소)
  return mountHost(parentDom, node, path);
};

/**
 * HOST 노드(일반 HTML 요소)를 마운트합니다.
 */
const mountHost = (parentDom: HTMLElement, node: VNode, path: string): Instance => {
  const { type, props, key } = node;

  // DOM 요소 생성
  const dom = document.createElement(type as string);

  // ref 처리
  if (props.ref) {
    props.ref.current = dom;
  }

  // 속성 설정
  setDomProps(dom, props);

  // 자식 마운트
  const children = reconcileChildren(dom, [], props.children || [], path);

  // DOM에 추가
  parentDom.appendChild(dom);

  return {
    kind: NodeTypes.HOST,
    dom,
    node,
    children,
    key,
    path,
  };
};

/**
 * 텍스트 노드를 마운트합니다.
 */
const mountText = (parentDom: HTMLElement, node: VNode, path: string): Instance => {
  const { props, key } = node;

  // 텍스트 노드 생성
  const dom = document.createTextNode(props.nodeValue || "");

  // DOM에 추가
  parentDom.appendChild(dom);

  return {
    kind: NodeTypes.TEXT,
    dom,
    node,
    children: [],
    key,
    path,
  };
};

/**
 * Fragment를 마운트합니다.
 */
const mountFragment = (parentDom: HTMLElement, node: VNode, path: string): Instance => {
  const { props, key } = node;

  // 자식 마운트
  const children = reconcileChildren(parentDom, [], props.children || [], path);

  return {
    kind: NodeTypes.FRAGMENT,
    dom: null,
    node,
    children,
    key,
    path,
  };
};

/**
 * 컴포넌트를 마운트합니다.
 */
const mountComponent = (parentDom: HTMLElement, node: VNode, path: string): Instance => {
  const { type, props, key } = node;

  // 훅 컨텍스트 설정
  context.hooks.componentStack.push(path);
  context.hooks.cursor.set(path, 0);
  context.hooks.visited.add(path);

  let childNode: VNode | null = null;

  try {
    // 컴포넌트 함수 실행
    childNode = (type as React.ComponentType)(props) || null;
  } finally {
    // 훅 컨텍스트 정리
    context.hooks.componentStack.pop();
  }

  // 자식 마운트
  const childPath = createChildPath(path, null, 0, childNode?.type);
  const child = reconcile(parentDom, null, childNode, childPath);

  return {
    kind: NodeTypes.COMPONENT,
    dom: null,
    node,
    children: child ? [child] : [],
    key,
    path,
  };
};

/**
 * 기존 인스턴스를 업데이트합니다.
 */
const update = (parentDom: HTMLElement, instance: Instance, node: VNode, path: string): Instance => {
  const { type } = node;

  // 컴포넌트
  if (typeof type === "function") {
    return updateComponent(parentDom, instance, node, path);
  }

  // Fragment
  if (type === Fragment) {
    return updateFragment(parentDom, instance, node, path);
  }

  // 텍스트 노드
  if (type === TEXT_ELEMENT) {
    return updateText(parentDom, instance, node, path);
  }

  // HOST 노드
  return updateHost(parentDom, instance, node, path);
};

/**
 * HOST 노드를 업데이트합니다.
 */
const updateHost = (_parentDom: HTMLElement, instance: Instance, node: VNode, path: string): Instance => {
  const { props, key } = node;
  const dom = instance.dom as HTMLElement;

  // ref 처리
  if (props.ref) {
    props.ref.current = dom;
  }

  // 속성 업데이트
  updateDomProps(dom, instance.node.props, props);

  // 자식 재조정
  const children = reconcileChildren(dom, instance.children, props.children || [], path);

  return {
    ...instance,
    node,
    children,
    key,
  };
};

/**
 * 텍스트 노드를 업데이트합니다.
 */
const updateText = (
  _parentDom: HTMLElement,
  instance: Instance,
  node: VNode,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _path: string,
): Instance => {
  const { props, key } = node;
  const dom = instance.dom as Text;

  // 텍스트 내용이 다르면 업데이트
  if (instance.node.props.nodeValue !== props.nodeValue) {
    dom.nodeValue = props.nodeValue || "";
  }

  return {
    ...instance,
    node,
    key,
  };
};

/**
 * Fragment를 업데이트합니다.
 */
const updateFragment = (parentDom: HTMLElement, instance: Instance, node: VNode, path: string): Instance => {
  const { props, key } = node;

  // 자식 재조정
  const children = reconcileChildren(parentDom, instance.children, props.children || [], path);

  return {
    ...instance,
    node,
    children,
    key,
  };
};

/**
 * 컴포넌트를 업데이트합니다.
 */
const updateComponent = (parentDom: HTMLElement, instance: Instance, node: VNode, path: string): Instance => {
  const { type, props, key } = node;

  // 훅 컨텍스트 설정
  context.hooks.componentStack.push(path);
  context.hooks.cursor.set(path, 0);
  context.hooks.visited.add(path);

  let childNode: VNode | null = null;

  try {
    // 컴포넌트 함수 재실행
    childNode = (type as React.ComponentType)(props) || null;
  } finally {
    // 훅 컨텍스트 정리
    context.hooks.componentStack.pop();
  }

  // 자식 재조정
  const childPath = createChildPath(path, null, 0, childNode?.type);
  const oldChild = instance.children[0] || null;
  const child = reconcile(parentDom, oldChild, childNode, childPath);

  return {
    ...instance,
    node,
    children: child ? [child] : [],
    key,
  };
};

/**
 * 자식 노드들을 재조정합니다.
 */
const reconcileChildren = (
  parentDom: HTMLElement,
  oldChildren: (Instance | null)[],
  newChildren: VNode[],
  parentPath: string,
): (Instance | null)[] => {
  const result: (Instance | null)[] = [];

  // key로 인덱싱된 기존 자식들
  const oldChildrenByKey = new Map<string, { instance: Instance; index: number }>();
  const oldChildrenByIndex: (Instance | null)[] = [];

  // 기존 자식들을 key와 index로 매핑
  oldChildren.forEach((child, index) => {
    if (child) {
      if (child.key !== null) {
        oldChildrenByKey.set(child.key, { instance: child, index });
      }
      oldChildrenByIndex[index] = child;
    }
  });

  // 사용된 기존 자식들 추적
  const usedOldChildren = new Set<number>();

  // 새 자식들을 순회하며 재조정
  newChildren.forEach((newChild, newIndex) => {
    const childKey = newChild.key;
    const childPath = createChildPath(parentPath, childKey, newIndex, newChild.type, newChildren);

    let oldChild: Instance | null = null;
    let oldIndex = -1;

    // key가 있으면 key로 찾기
    if (childKey !== null && oldChildrenByKey.has(childKey)) {
      const found = oldChildrenByKey.get(childKey)!;
      oldChild = found.instance;
      oldIndex = found.index;
      usedOldChildren.add(oldIndex);
    }
    // key가 없으면 같은 위치에서 같은 타입 찾기
    else if (childKey === null) {
      for (let i = 0; i < oldChildrenByIndex.length; i++) {
        if (usedOldChildren.has(i)) continue;

        const candidate = oldChildrenByIndex[i];
        if (candidate && candidate.key === null && candidate.node.type === newChild.type) {
          oldChild = candidate;
          oldIndex = i;
          usedOldChildren.add(i);
          break;
        }
      }
    }

    // 재조정
    const newInstance = reconcile(parentDom, oldChild, newChild, childPath);
    result.push(newInstance);

    // DOM 위치 조정
    if (newInstance && oldChild) {
      // 기존 노드를 재사용하는 경우, 위치가 바뀌었으면 이동
      const currentFirstDom = getFirstDom(newInstance);
      if (currentFirstDom) {
        // anchor 계산: 다음 형제의 첫 번째 DOM
        let anchor: HTMLElement | Text | null = null;
        for (let i = newIndex + 1; i < result.length; i++) {
          anchor = getFirstDom(result[i]);
          if (anchor) break;
        }

        // 위치가 잘못되어 있으면 재삽입
        if (anchor !== currentFirstDom.nextSibling) {
          removeInstance(parentDom, newInstance);
          insertInstance(parentDom, newInstance, anchor);
        }
      }
    }
  });

  // 사용되지 않은 기존 자식들 언마운트
  oldChildren.forEach((child, index) => {
    if (child && !usedOldChildren.has(index)) {
      unmount(parentDom, child);
    }
  });

  return result;
};

/**
 * 인스턴스를 언마운트합니다.
 */
const unmount = (parentDom: HTMLElement, instance: Instance): void => {
  // 컴포넌트의 경우 cleanup 함수 실행
  if (instance.kind === NodeTypes.COMPONENT) {
    const hooks = context.hooks.state.get(instance.path);
    if (hooks) {
      hooks.forEach((hook) => {
        if (hook && hook.kind === "effect" && hook.cleanup) {
          hook.cleanup();
        }
      });
    }

    // 훅 상태 제거
    context.hooks.state.delete(instance.path);
    context.hooks.cursor.delete(instance.path);
  }

  // 자식 언마운트
  instance.children.forEach((child) => {
    if (child) {
      unmount(parentDom, child);
    }
  });

  // DOM 제거
  removeInstance(parentDom, instance);
};
