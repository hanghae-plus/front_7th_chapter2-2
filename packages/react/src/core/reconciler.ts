import { context } from "./context";
import { Fragment, NodeTypes, TEXT_ELEMENT } from "./constants";
import { ComponentType, Instance, VNode } from "./types";
import {
  getFirstDom,
  getFirstDomFromChildren,
  getDomNodes,
  insertInstance,
  removeInstance,
  setDomProps,
  updateDomProps,
} from "./dom";
import { createChildPath } from "./elements";
import { isEmptyValue } from "../utils";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _ = { getFirstDom, getFirstDomFromChildren, insertInstance, removeInstance };

/**
 * 이전 인스턴스와 새로운 VNode를 비교하여 DOM을 업데이트하는 재조정 과정을 수행합니다.
 *
 * reconcile = React의 "다른 그림 찾기" 전문가
 *
 * @param parentDom - 부모 DOM 요소
 * @param instance - 이전 렌더링의 인스턴스
 * @param node - 새로운 VNode
 * @param path - 현재 노드의 고유 경로
 * @returns 업데이트되거나 새로 생성된 인스턴스
 *
 *  1. 새 노드가 null이면 기존 인스턴스를 제거합니다. (unmount)
 *  2. 기존 인스턴스가 없으면 새 노드를 마운트합니다. (mount)
 *  3. 타입이나 키가 다르면 기존 인스턴스를 제거하고 새로 마운트합니다.
 *  4. 타입과 키가 같으면 인스턴스를 업데이트합니다. (update)
 *    - DOM 요소: updateDomProps로 속성 업데이트 후 자식 재조정
 *    - 컴포넌트: 컴포넌트 함수 재실행 후 자식 재조정
 */
export const reconcile = (
  parentDom: HTMLElement,
  instance: Instance | null,
  node: VNode | null,
  path: string,
): Instance | null => {
  // Case 1: unmount (새것 없음)
  if (node === null) {
    if (instance) {
      unmount(parentDom, instance);
    }
    return null;
  }

  // Case 2: mount (이전 것 없음)
  if (instance === null) {
    return mount(parentDom, node, path);
  }

  // Case 3: replace (타입 다름)
  if (node.type !== instance.node.type) {
    const newInstance = mount(parentDom, node, path);
    unmount(parentDom, instance);
    return newInstance;
  }

  // Case 4: update (타입 같음)
  return update(parentDom, node, instance, path);
};

/**
 * mount: 새로 만들기
 * 1. DOM 요소 생성
 * 2. 속성 설정
 * 3. 자식들 mount
 * 4. DOM에 삽입
 */
const mount = (parentDom: HTMLElement, node: VNode, path: string): Instance => {
  if (node.type === TEXT_ELEMENT) {
    // 1. 텍스트 노드 생성
    const textNode = document.createTextNode(node.props.nodeValue || "");

    // 2. DOM에 삽입
    parentDom.appendChild(textNode);

    // 3. Instance 반환
    return {
      kind: "text",
      dom: textNode,
      node: node,
      children: [],
      key: node.key,
      path: path,
    };
  }

  if (node.type === Fragment) {
    // 1. 자식들만 mount (Fragment 자체는 DOM 없음)
    const childInstances: (Instance | null)[] = [];

    // 2. 자식들만 mount (Fragment 자체는 DOM 없음)
    for (const child of node.props.children || []) {
      if (!isEmptyValue(child)) {
        const childPath = createChildPath(path, child.key, childInstances.length, child.type);
        const childInstance = mount(parentDom, child, childPath);
        childInstances.push(childInstance);
      }
    }

    // 3. Instance 반환 (dom은 null)
    return {
      kind: "fragment",
      dom: null,
      node: node,
      children: childInstances,
      key: node.key,
      path: path,
    };
  }

  if (typeof node.type === "function") {
    return mountComponent(parentDom, node, path);
  }

  // 1. 일반 DOM 요소 생성
  const dom = document.createElement(node.type as string);

  // 2. Props 적용
  setDomProps(dom, node.props);

  // 3. 자식들 마운트
  const childInstances: (Instance | null)[] = [];
  const children = node.props?.children || [];
  for (const child of children) {
    if (!isEmptyValue(child)) {
      const childPath = createChildPath(path, child.key, childInstances.length, child.type);
      const childInstance = mount(dom, child, childPath);
      childInstances.push(childInstance);
    }
  }

  // 4. DOM에 추가
  parentDom.appendChild(dom);

  return {
    kind: NodeTypes.HOST,
    dom: dom,
    node: node,
    children: childInstances,
    key: node.key,
    path: path,
  };
};

/**
 * update: 수정하기
 * 1. 속성 비교 & 업데이트
 * 2. 자식들 reconcile (재귀!)
 */

const update = (parentDom: HTMLElement, node: VNode, instance: Instance, path: string): Instance => {
  // 1. TEXT_ELEMENT
  if (node.type === TEXT_ELEMENT) {
    const textNode = instance.dom as Text;
    const oldValue = instance.node.props.nodeValue;
    const newValue = node.props.nodeValue;

    if (oldValue !== newValue) {
      textNode.nodeValue = newValue || "";
    }

    return {
      ...instance,
      node: node,
    };
  }

  // 2. Fragment
  if (node.type === Fragment) {
    const children = node.props?.children || [];
    const childInstances = reconcileChildren(parentDom, children, instance.children, path);

    return {
      ...instance,
      node: node,
      children: childInstances,
    };
  }

  // 3. Component
  if (typeof node.type === "function") {
    return updateComponent(parentDom, node, instance, path);
  }

  // 4. 일반 DOM
  const dom = instance.dom as HTMLElement;

  // Props 업데이트
  updateDomProps(dom, instance.node.props, node.props);

  // Children reconcile
  const children = node.props?.children || [];
  const childInstances = reconcileChildren(dom, children, instance.children, path);

  return {
    ...instance,
    node: node,
    children: childInstances,
  };
};

/**
 * unmount: 제거하기
 * 1. cleanup 함수 실행
 * 2. 자식들 먼저 unmount (재귀)
 * 3. DOM 제거
 * 4. Hook 정리
 */
const unmount = (parentDom: HTMLElement, instance: Instance): void => {
  // 1. cleanup 함수를 effect queue에 추가 (비동기 실행)
  if (instance.path) {
    const hookList = context.hooks.state.get(instance.path);
    if (hookList) {
      // 모든 Hook의 cleanup 함수를 queue에 추가
      for (let i = 0; i < hookList.length; i++) {
        const hook = hookList[i];
        if (hook.cleanup) {
          // cleanup을 래핑하여 실행 후 제거
          const cleanup = hook.cleanup;
          context.effects.queue.push(() => {
            cleanup();
          });
          // cleanup 실행 전 미리 제거 (중복 방지)
          hook.cleanup = undefined;
        }
      }
    }
  }

  // 2. 자식들 먼저 unmount (재귀)
  for (const child of instance.children) {
    if (child) {
      // 자식이 있는지 확인
      // childContainer: Fragment면 parentDom, 아니면 instance.dom 사용
      const childContainer = instance.dom instanceof HTMLElement ? instance.dom : parentDom;
      unmount(childContainer, child);
    }
  }

  // 3. DOM 제거
  if (instance.dom) {
    if (instance.dom.parentNode) {
      instance.dom.parentNode.removeChild(instance.dom);
    }
  }

  // 4. Hook 정리 (visited 체크)
  // migration된 컴포넌트의 hookList를 보호하기 위해 visited 체크
  // 예: Item(path=.c3) unmount 시, Footer가 .c3로 migration했다면
  //     visited.has('.c3')가 true이므로 삭제하지 않음
  if (instance.path && !context.hooks.visited.has(instance.path)) {
    context.hooks.state.delete(instance.path);
    context.hooks.cursor.delete(instance.path);
  }
};

const reconcileChildren = (
  container: HTMLElement,
  newChildren: VNode[],
  oldChildren: (Instance | null)[],
  path: string,
): (Instance | null)[] => {
  const childInstances: (Instance | null)[] = [];

  // key를 가진 old instance들을 Map으로 관리
  const oldKeyedInstances = new Map<string, Instance>();
  const oldInstancesByIndex: (Instance | null)[] = [];

  // oldChildren을 key와 인덱스로 분류
  for (let i = 0; i < oldChildren.length; i++) {
    const oldChild = oldChildren[i];
    if (oldChild && oldChild.node.key) {
      oldKeyedInstances.set(oldChild.node.key, oldChild);
    }
    oldInstancesByIndex.push(oldChild);
  }

  // 사용된 old instance 추적
  const usedInstances = new Set<Instance>();

  // 첫 번째 패스: 매칭을 완료하고 migration 정보 수집
  const matchedPairs: Array<{
    oldChild: Instance | null;
    newChild: VNode;
    childPath: string;
    index: number;
  }> = [];

  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i];

    if (!newChild || isEmptyValue(newChild)) {
      continue;
    }

    // key가 있으면 key로 매칭, 없으면 인덱스와 타입으로 매칭
    let oldChild: Instance | null = null;

    if (newChild.key) {
      // key로 매칭
      const keyedInstance = oldKeyedInstances.get(newChild.key);
      if (keyedInstance) {
        oldChild = keyedInstance;
        usedInstances.add(keyedInstance);
      }
    } else {
      // key가 없으면 인덱스로 매칭 시도
      const candidateByIndex = oldInstancesByIndex[i] || null;

      if (candidateByIndex && candidateByIndex.node.type === newChild.type) {
        // 인덱스의 후보가 타입도 일치하면 사용
        oldChild = candidateByIndex;
        usedInstances.add(candidateByIndex);
      } else {
        // 타입이 안 맞으면 나머지 oldChildren에서 같은 타입 찾기
        for (let j = 0; j < oldChildren.length; j++) {
          const candidate = oldChildren[j];
          if (
            candidate &&
            !usedInstances.has(candidate) &&
            !candidate.node.key && // key 없는 것만
            candidate.node.type === newChild.type
          ) {
            oldChild = candidate;
            usedInstances.add(candidate);
            break;
          }
        }
      }
    }

    const childPath = createChildPath(path, newChild.key, i, newChild.type);
    matchedPairs.push({ oldChild, newChild, childPath, index: i });
  }

  // Hook state migration을 역순으로 수행 (path 충돌 방지)
  // 예: Footer(root.c0.c3 → root.c0.c5)를 Item(2)(root.c0.c3) mount 전에 처리
  for (let i = matchedPairs.length - 1; i >= 0; i--) {
    const { oldChild, childPath } = matchedPairs[i];

    if (oldChild && oldChild.path !== childPath && oldChild.kind === NodeTypes.COMPONENT) {
      const oldHookList = context.hooks.state.get(oldChild.path);
      if (oldHookList) {
        context.hooks.state.set(childPath, oldHookList);
        context.hooks.state.delete(oldChild.path);
        // oldChild.path 업데이트 (reconcile에서 사용하므로)
        oldChild.path = childPath;
      }
      // cursor도 삭제 (새 path에서는 0부터 시작)
      context.hooks.cursor.delete(oldChild.path);
    }
  }

  // 두 번째 패스: reconcile 수행
  for (const { oldChild, newChild, childPath } of matchedPairs) {
    const childInstance = reconcile(container, oldChild, newChild, childPath);

    if (childInstance) {
      childInstances.push(childInstance);
    }
  }

  // DOM 순서 재배치 (key가 있는 경우)
  // 이전 instance의 마지막 DOM을 추적하여 정확한 위치 확인
  let lastDom: Node | null = null;

  for (let i = 0; i < childInstances.length; i++) {
    const instance = childInstances[i];
    if (!instance) continue;

    const domNodes = getDomNodes(instance);
    for (const domNode of domNodes) {
      if (domNode.parentNode === container) {
        // 올바른 위치 확인
        if (lastDom) {
          // lastDom 바로 다음에 있어야 함
          if (lastDom.nextSibling !== domNode) {
            container.insertBefore(domNode, lastDom.nextSibling);
          }
        } else {
          // 첫 번째 자식이어야 함
          if (container.firstChild !== domNode) {
            container.insertBefore(domNode, container.firstChild);
          }
        }
        lastDom = domNode;
      }
    }
  }

  // 사용되지 않은 old instance들을 unmount
  for (const oldChild of oldChildren) {
    if (oldChild && !usedInstances.has(oldChild)) {
      reconcile(container, oldChild, null, "");
    }
  }

  return childInstances;
};

/**
 * mountComponent: 컴포넌트를 처음 마운트합니다.
 *
 * 🎯 역할: 함수 컴포넌트를 실행해서 실제 DOM으로 만들기
 *
 * 📦 과정:
 * 1. Hook 컨텍스트 설정 (이 컴포넌트의 useState들을 추적하기 위해)
 * 2. 컴포넌트 함수 실행 (설계도 → 실제 VNode)
 * 3. 나온 결과를 mount (VNode → DOM)
 * 4. Hook 컨텍스트 정리
 *
 * @example
 * function Counter() {
 *   const [count] = useState(0);
 *   return <div>{count}</div>;
 * }
 *
 * mountComponent(parentDom, <Counter />, "root.c0")
 * → Counter 함수 실행
 * → <div>0</div> VNode 얻음
 * → 실제 DOM으로 만듦
 */
const mountComponent = (parentDom: HTMLElement, node: VNode, path: string): Instance => {
  // 1. Hook 컨텍스트 시작
  //    "지금부터 이 컴포넌트의 Hook들이 실행됩니다!" 라고 알림
  context.hooks.componentStack.push(path);
  context.hooks.cursor.set(path, 0); // Hook 카운터 초기화
  context.hooks.visited.add(path); // 방문 기록

  try {
    // 2. 컴포넌트 함수 실행
    //    예: Counter({ count: 5 }) → <div>5</div>
    const Component = node.type as ComponentType;
    const renderedVNode = Component(node.props) as VNode;

    // 3. 실행 결과를 실제 DOM으로 mount
    //    <div>5</div> → 진짜 DOM 요소
    //    자식에게 새로운 경로 생성 (컴포넌트의 자식은 .child 경로 사용)
    const childPath = createChildPath(path, renderedVNode.key, 0, renderedVNode.type);
    const childInstance = mount(parentDom, renderedVNode, childPath);

    // 4. 컴포넌트 인스턴스 반환
    return {
      kind: NodeTypes.COMPONENT,
      dom: null, // 컴포넌트는 직접 DOM 없음 (자식이 가짐)
      node: node,
      children: [childInstance], // 실행 결과가 자식
      key: node.key,
      path: path,
    };
  } finally {
    // 5. Hook 컨텍스트 정리
    //    "이 컴포넌트 실행 끝!" 라고 알림
    context.hooks.componentStack.pop();
  }
};

/**
 * updateComponent: 기존 컴포넌트를 업데이트합니다.
 *
 * 🎯 역할: 컴포넌트를 다시 실행해서 변경사항 반영하기
 *
 * 📦 과정:
 * 1. Hook 컨텍스트 설정 (기존 state 유지하면서)
 * 2. 컴포넌트 함수 다시 실행
 * 3. 이전 결과와 새 결과를 reconcile
 * 4. Hook 컨텍스트 정리
 *
 * @example
 * // 이전: <div>0</div>
 * // setState(1) 호출됨
 * // updateComponent 실행
 * // → Counter 함수 다시 실행
 * // → <div>1</div> 얻음
 * // → reconcile로 DOM 업데이트
 */
const updateComponent = (parentDom: HTMLElement, node: VNode, instance: Instance, path: string): Instance => {
  //  Hook 컨텍스트 시작
  context.hooks.componentStack.push(path);
  context.hooks.cursor.set(path, 0); // Hook 카운터 다시 0부터
  context.hooks.visited.add(path);

  // path가 변경되었고, 아직 migration 안 됐으면 hook state 이전
  // (reconcileChildren에서 미리 migration했을 수 있음)
  if (instance.path !== path) {
    const oldHookList = context.hooks.state.get(instance.path);
    if (oldHookList) {
      // 이전 path에 아직 hookList가 있으면 migration
      context.hooks.state.set(path, oldHookList);
      context.hooks.state.delete(instance.path);
    }
  }

  try {
    // 2. 컴포넌트 함수 다시 실행
    //    이번엔 업데이트된 state를 가지고 실행됨!
    const Component = node.type as ComponentType;
    const renderedVNode = Component(node.props) as VNode;

    // 3. 이전 자식과 새 자식을 비교 (reconcile)
    //    예: <div>0</div> vs <div>1</div> → 텍스트만 바꿈
    //    자식에게 새로운 경로 생성
    const oldChild = instance.children[0];
    const childPath = createChildPath(path, renderedVNode.key, 0, renderedVNode.type);
    const newChild = reconcile(parentDom, oldChild, renderedVNode, childPath);

    // 4. 업데이트된 인스턴스 반환 (새 path 포함)
    return {
      ...instance,
      node: node,
      children: [newChild],
      path: path, // path 업데이트
    };
  } finally {
    // 5. Hook 컨텍스트 정리
    context.hooks.componentStack.pop();
  }
};
