import { context } from "./context";
import { Fragment, NodeTypes, TEXT_ELEMENT, NodeType } from "./constants";
import { Instance, VNode } from "./types";
import {
  getFirstDom,
  getFirstDomFromChildren,
  insertInstance,
  removeInstance,
  setDomProps,
  updateDomProps,
  createInstance,
} from "./dom";
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
  // 여기를 구현하세요.
  // 1. 새 노드가 null이면 기존 인스턴스를 제거합니다. (unmount)
  if (node === null) {
    removeInstance(parentDom, instance);
    return null;
  }
  // 2. 기존 인스턴스가 없으면 새 노드를 마운트합니다. (mount)
  if (instance === null) {
    return createInstance(node);
  }
  // 3. 타입이나 키가 다르면 기존 인스턴스를 제거하고 새로 마운트합니다.
  if (instance.node.type !== node.type || instance.key !== node.key) {
    instance.node = node;
    const _path = createChildPath(path, node.key, 0, node.type);
    instance.path = _path;
    removeInstance(parentDom, instance);
    return createInstance(node);
  }
  // 4. 타입과 키가 같으면 인스턴스를 업데이트합니다. (update)
  //    - DOM 요소: updateDomProps로 속성 업데이트 후 자식 재조정
  //    - 컴포넌트: 컴포넌트 함수 재실행 후 자식 재조정
  if (instance.node.type === node.type && instance.key === node.key) {
    const prevProps = instance.node.props;
    instance.node = node;

    if (instance.kind === NodeTypes.TEXT) {
      const textNode = instance.dom as Text;
      const newNodeValue = (node.props as { nodeValue: string }).nodeValue;
      if (textNode.nodeValue !== newNodeValue) {
        textNode.nodeValue = newNodeValue;
      }
    } else if (instance.kind === NodeTypes.HOST && instance.dom) {
      updateDomProps(instance.dom as HTMLElement, prevProps, node.props);
    }

    if (instance.kind === NodeTypes.COMPONENT || instance.kind === NodeTypes.FRAGMENT) {
      instance.children =
        node.props.children?.map((child, index) =>
          reconcile(parentDom as HTMLElement, instance.children[index], child, ""),
        ) ?? [];
    } else if (instance.kind === NodeTypes.HOST) {
      instance.children =
        node.props.children?.map((child, index) =>
          reconcile(instance.dom as HTMLElement, instance.children[index], child, ""),
        ) ?? [];
    }
    return instance;
  }
  return null;
};
