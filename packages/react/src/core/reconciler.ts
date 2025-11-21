import { context } from "./context";
import { NodeTypes } from "./constants";
import { Instance, VNode } from "./types";
import { getFirstDom, createInstance } from "./dom";
import { createChildPath } from "./elements";
import { hookManager } from "./hookManager";

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
  // 여기를 구현하세요.
  // 1. 새 노드가 null이면 기존 인스턴스를 제거합니다. (unmount)
  if (node === null) {
    context.domEffects.push({ type: "REMOVE", instance: instance, parentDOM: parentDom });
    return null;
  }
  // 2. 기존 인스턴스가 없으면 새 노드를 마운트합니다. (mount)
  if (instance === null) {
    const newInstance = createInstance(node, path);
    context.domEffects.push({ type: "INSERT", instance: newInstance, parentDOM: parentDom, anchor });
    return newInstance;
  }
  // 3. 타입이나 키가 다르면 기존 인스턴스를 제거하고 새로 마운트합니다.
  if (instance.node.type !== node.type || instance.key !== node.key) {
    const _path = createChildPath(path, node.key, 0, node.type);
    context.domEffects.push({ type: "REMOVE", instance: instance, parentDOM: parentDom });
    const newInstance = createInstance(node, _path);
    context.domEffects.push({ type: "INSERT", instance: newInstance, parentDOM: parentDom, anchor });
    return newInstance;
  }
  // 4. 타입과 키가 같으면 인스턴스를 업데이트합니다. (update)
  //    - DOM 요소: updateDomProps로 속성 업데이트 후 자식 재조정
  //    - 컴포넌트: 컴포넌트 함수 재실행 후 자식 재조정
  if (instance.node.type === node.type && instance.key === node.key) {
    const prevProps = instance.node.props;
    instance.node = node;

    // key가 없으면 path를 업데이트 (위치가 바뀔 수 있음)
    // key가 있으면 instance.path 유지 (hook 상태 유지)
    const currentPath = instance.key ? instance.path : path;
    if (!instance.key) {
      instance.path = path;
    }

    if (instance.kind === NodeTypes.TEXT) {
      const textNode = instance.dom as Text;
      const newNodeValue = (node.props as { nodeValue: string }).nodeValue;
      if (textNode.nodeValue !== newNodeValue) {
        context.domEffects.push({
          type: "UPDATE_TEXT",
          dom: textNode,
          prevText: textNode.nodeValue ?? "",
          nextText: newNodeValue,
        });
      }
    } else if (instance.kind === NodeTypes.HOST && instance.dom) {
      if (prevProps !== node.props) {
        context.domEffects.push({
          type: "UPDATE_PROPS",
          dom: instance.dom as HTMLElement,
          prevProps: prevProps,
          nextProps: node.props,
        });
      }
    }

    // 자식 Reconcile
    if (instance.kind === NodeTypes.COMPONENT) {
      const ComponentFunction = node.type as React.ComponentType;
      const renderedNode = hookManager.runComponent(currentPath, ComponentFunction, node.props);
      instance.children = reconcileChildren(
        parentDom,
        instance.children as Instance[],
        renderedNode ? [renderedNode] : [],
        currentPath,
      );
    } else if (instance.kind === NodeTypes.FRAGMENT) {
      instance.children = reconcileChildren(
        parentDom,
        instance.children as Instance[],
        node.props.children ?? [],
        currentPath,
      );
    } else if (instance.kind === NodeTypes.HOST) {
      instance.children = reconcileChildren(
        instance.dom as HTMLElement,
        instance.children as Instance[],
        node.props.children ?? [],
        currentPath,
      );
    }

    // UPDATE 경로에서는 위치 확인 안 함
    // MOUNT와 REPLACE는 reconcile의 다른 경로에서 이미 INSERT를 큐잉함
    context.domEffects.push({
      type: "INSERT",
      instance: instance,
      parentDOM: parentDom,
      anchor,
    });
    return instance;
  }
  return null;
};

const reconcileChildren = (
  parentDom: HTMLElement,
  oldChildren: Instance[],
  newVNodes: VNode[],
  parentPath: string,
): Instance[] => {
  if (!newVNodes || newVNodes.length === 0) {
    oldChildren.forEach((oldChild) => {
      context.domEffects.push({
        type: "REMOVE",
        instance: oldChild ?? null,
        parentDOM: parentDom,
      });
    });
    return [];
  }

  const oldChildrenMap = new Map<string, Instance>();
  oldChildren.forEach((child) => {
    if (child.key) {
      oldChildrenMap.set(child.key, child);
    }
  });

  const usedOldChildren = new Set<Instance>();

  const newChildren = newVNodes.map((node, index) => {
    const childPath = createChildPath(parentPath, node.key, index, node.type, newVNodes);
    let oldChild: Instance | null = null;

    if (node.key) {
      oldChild = oldChildrenMap.get(node.key) ?? null;
    } else {
      const candidateChild = oldChildren[index];
      if (candidateChild && candidateChild.node.type === node.type) {
        oldChild = candidateChild;
      } else {
        oldChild = oldChildren.find((child) => !usedOldChildren.has(child) && child.node.type === node.type) ?? null;
      }
    }

    if (oldChild) {
      usedOldChildren.add(oldChild);
    }

    return { node, childPath, oldChild };
  });

  // 뒤에서부터 reconcile해서 anchor가 정확하도록 함
  let anchor: HTMLElement | Text | null = null;
  const reconciledChildren: Instance[] = [];

  for (let i = newChildren.length - 1; i >= 0; i--) {
    const { node, childPath, oldChild } = newChildren[i];
    const reconciledChild = reconcile(parentDom, oldChild, node, childPath, anchor);

    // reconcile은 null을 반환할 수 있지만, 정상 케이스에서는 항상 Instance를 반환
    if (reconciledChild) {
      reconciledChildren.unshift(reconciledChild);
      // 다음 reconcile을 위한 anchor 업데이트
      const childDom = getFirstDom(reconciledChild);
      if (childDom) {
        anchor = childDom;
      }
    }
  }

  // 사용되지 않은 이전 자식들 제거
  oldChildren.forEach((oldChild) => {
    if (!usedOldChildren.has(oldChild)) {
      context.domEffects.push({
        type: "REMOVE",
        instance: oldChild,
        parentDOM: parentDom,
      });
    }
  });

  return reconciledChildren;
};
