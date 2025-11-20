import { context } from "./context";
import { Fragment, NodeTypes, TEXT_ELEMENT } from "./constants";
import { Instance, VNode } from "./types";
import { getFirstDomFromChildren, insertInstance, removeInstance, setDomProps, updateDomProps } from "./dom";
import { createChildPath } from "./elements";
import { isEmptyValue } from "../utils";

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
  // 1. 새 노드가 null이면 기존 인스턴스를 언마운트 (unmount)
  if (node === null || isEmptyValue(node)) {
    if (instance) {
      unmount(instance);
    }
    return null;
  }

  // 2. 기존 인스턴스가 없으면 새로 마운트 (mount)
  if (instance === null) {
    return mount(parentDom, node, path);
  }

  // 3. 타입이나 키가 다르면 기존 인스턴스를 제거하고 새로 마운트 (replace)
  if (instance.node.type !== node.type || instance.node.key !== node.key) {
    unmount(instance);
    return mount(parentDom, node, path);
  }

  // 4. 타입과 키가 같으면 인스턴스를 업데이트 (update)
  return update(parentDom, instance, node, path);
};

/**
 * 새로운 VNode를 마운트하여 인스턴스를 생성하고 DOM에 추가합니다.
 */
const mount = (parentDom: HTMLElement, node: VNode, path: string): Instance => {
  const { type, props } = node;

  // 노드 타입 결정
  let kind: Instance["kind"];
  let dom: HTMLElement | Text | null = null;

  // TEXT_ELEMENT: 텍스트 노드
  if (type === TEXT_ELEMENT) {
    kind = NodeTypes.TEXT;
    dom = document.createTextNode(props?.nodeValue ?? "");
  }
  // Fragment: 여러 자식을 그룹화하는 가상 노드
  else if (type === Fragment) {
    kind = NodeTypes.FRAGMENT;
    dom = null; // Fragment는 실제 DOM 노드를 갖지 않음
  }
  // 함수형 컴포넌트
  else if (typeof type === "function") {
    kind = NodeTypes.COMPONENT;
    dom = null; // 컴포넌트도 실제 DOM 노드를 갖지 않음
  }
  // 일반 HTML 요소 (div, span 등)
  else {
    kind = NodeTypes.HOST;
    dom = document.createElement(type as string);
    // DOM 요소의 속성 설정
    setDomProps(dom as HTMLElement, props);
  }

  // 인스턴스 생성
  const instance: Instance = {
    kind,
    dom,
    node,
    children: [],
    key: node.key,
    path,
  };

  // 자식들을 재조정
  // props가 없을 수 있으므로 옵셔널 체이닝 사용
  reconcileChildren(parentDom, instance, props?.children ?? [], path);

  return instance;
};

/**
 * 기존 인스턴스를 새로운 VNode로 업데이트합니다.
 */
const update = (parentDom: HTMLElement, instance: Instance, node: VNode, path: string): Instance => {
  const { props } = node;

  // 이전 props를 먼저 저장 (instance.node를 업데이트하기 전에)
  const prevProps = instance.node.props;

  // 노드 정보 업데이트
  instance.node = node;
  instance.path = path;

  // TEXT 타입: 텍스트 내용 업데이트
  if (instance.kind === NodeTypes.TEXT && instance.dom) {
    const textNode = instance.dom as Text;
    const newNodeValue = props?.nodeValue ?? "";
    if (textNode.nodeValue !== newNodeValue) {
      textNode.nodeValue = newNodeValue;
    }
  }

  // HOST 타입 (일반 DOM 요소): 속성 업데이트
  if (instance.kind === NodeTypes.HOST && instance.dom) {
    // 이전 props와 새 props를 비교하여 업데이트
    updateDomProps(instance.dom as HTMLElement, prevProps, props);
  }

  // 자식들을 재조정
  // props가 없을 수 있으므로 옵셔널 체이닝 사용
  reconcileChildren(parentDom, instance, props?.children ?? [], path);

  return instance;
};

/**
 * 인스턴스를 언마운트하고 DOM에서 제거합니다.
 */
const unmount = (instance: Instance): void => {
  // 자식들을 먼저 언마운트
  for (const child of instance.children) {
    if (child) {
      unmount(child);
    }
  }

  // DOM에서 제거
  removeInstance(instance);

  // 훅 정리는 cleanupUnusedHooks에서 처리됨
};

/**
 * 자식 노드들을 재조정합니다.
 */
const reconcileChildren = (parentDom: HTMLElement, instance: Instance, children: VNode[], parentPath: string): void => {
  const oldChildren = instance.children;
  const newChildren: (Instance | null)[] = [];

  // 컴포넌트 스택에 현재 경로 추가 (훅을 위해)
  if (instance.kind === NodeTypes.COMPONENT) {
    context.hooks.componentStack.push(parentPath);
    context.hooks.visited.add(parentPath);

    // 커서를 먼저 리셋 (컴포넌트 함수 실행 전에!)
    // 컴포넌트 함수 실행 중 훅들이 이 커서를 사용하므로 반드시 먼저 초기화해야 함
    context.hooks.cursor.set(parentPath, 0);

    // 컴포넌트 함수 실행하여 실제 렌더링할 VNode 얻기
    // props가 없을 수 있으므로 빈 객체를 기본값으로 사용
    const componentNode = (instance.node.type as React.ComponentType)(instance.node.props || {});

    // 컴포넌트의 결과를 자식으로 재조정
    const childPath = createChildPath(parentPath, null, 0, componentNode?.type, [componentNode!]);
    const oldChild = oldChildren[0] ?? null;
    const childInstance = reconcile(parentDom, oldChild, componentNode, childPath);

    if (childInstance) {
      newChildren.push(childInstance);

      // 컴포넌트의 자식이 변경되었을 때 DOM 삽입
      // 1. oldChild가 없음 (새로 추가)
      // 2. childInstance !== oldChild (mount로 새 인스턴스 생성)
      if (!oldChild || childInstance !== oldChild) {
        insertInstance(parentDom, childInstance);
      }
    }

    // 컴포넌트 스택에서 제거
    context.hooks.componentStack.pop();

    instance.children = newChildren;
    return;
  }

  // Fragment나 Host 노드의 자식들 처리
  const parentDomForChildren = instance.kind === NodeTypes.HOST ? (instance.dom as HTMLElement) : parentDom;

  // key가 있는 자식들을 맵으로 관리 (효율적인 재사용을 위해)
  const oldChildrenByKey = new Map<string | number, Instance>();
  for (const oldChild of oldChildren) {
    if (oldChild?.key !== null) {
      oldChildrenByKey.set(oldChild.key, oldChild);
    }
  }

  // 사용된 oldChildren을 추적 (key/non-key 혼합 시 unmount 누락 방지)
  const usedOldChildren = new Set<Instance>();

  // 새 자식들을 순회하며 재조정
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (!child || isEmptyValue(child)) {
      continue;
    }

    // 자식의 경로 생성
    const childPath = createChildPath(parentPath, child.key, i, child.type, children);

    let oldChild: Instance | null = null;

    // key가 있으면 같은 key를 가진 이전 인스턴스를 찾음
    if (child.key) {
      oldChild = oldChildrenByKey.get(child.key) ?? null;
      if (oldChild) {
        oldChildrenByKey.delete(child.key);
        usedOldChildren.add(oldChild);
      }
    }
    // key가 없으면 같은 인덱스의 이전 인스턴스 사용
    else {
      oldChild = oldChildren[i] ?? null;
      if (oldChild) {
        usedOldChildren.add(oldChild);
      }
    }

    // 재조정
    const newChild = reconcile(parentDomForChildren, oldChild, child, childPath);

    if (newChild) {
      newChildren.push(newChild);

      // DOM 위치 조정 (key 기반 재배치 및 마운트)
      // 다음 경우에 DOM에 삽입:
      // 1. oldChild가 없음 (새로 추가)
      // 2. newChild !== oldChild (mount로 새 인스턴스 생성)
      // 3. oldChild !== oldChildren[i] (key 기반 재배치로 위치 변경)
      if (!oldChild || newChild !== oldChild || oldChild !== oldChildren[i]) {
        // anchor: 아직 처리되지 않은 다음 형제 중 첫 번째 DOM 노드
        // oldChildren의 i+1 이후 자식들 중에서 첫 번째 DOM 노드를 찾음
        const anchor = getFirstDomFromChildren(oldChildren.slice(i + 1));
        insertInstance(parentDomForChildren, newChild, anchor);
      }
    }
  }

  // 사용되지 않은 모든 oldChildren 제거
  // key/non-key 혼합 시에도 중간에 스킵된 것들을 모두 언마운트
  for (const oldChild of oldChildren) {
    if (oldChild && !usedOldChildren.has(oldChild)) {
      unmount(oldChild);
    }
  }

  instance.children = newChildren;
};
