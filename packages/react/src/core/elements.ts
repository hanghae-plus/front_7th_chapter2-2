/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEmptyValue } from "../utils";
import { VNode } from "./types";
import { Fragment, TEXT_ELEMENT } from "./constants";

export const normalizeNode = (node: VNode): VNode | null => {
  if (isEmptyValue(node)) {
    return null;
  }

  if (Array.isArray(node)) {
    return createElement(Fragment, null, ...node);
  }

  if (typeof node !== "object") {
    return createTextElement(node);
  }

  return { ...node, props: node.props ?? null, key: node.key ?? null };
};

const createTextElement = (node: VNode): VNode => ({
  type: TEXT_ELEMENT,
  key: null,
  props: { nodeValue: String(node), children: [] },
});

export const createElement = (
  type: string | symbol | React.ComponentType<any>,
  originProps?: Record<string, any> | null,
  ...rawChildren: any[]
) => {
  const { key = null, ...props } = originProps ?? {};
  const children = rawChildren
    .flat(Infinity)
    .map(normalizeNode)
    .filter((child): child is VNode => child !== null);

  return normalizeNode({ type, key, props: { ...props, children: children.length > 0 ? children : undefined } })!;
};

export const createChildPath = (
  parentPath: string,
  key: string | null,
  index: number,
  nodeType?: string | symbol | React.ComponentType,
  siblings?: VNode[],
): string => {
  if (key !== null) {
    return `${parentPath}.k${encodeURIComponent(String(key))}`;
  }

  // 컴포넌트 타입이 있는 경우, 현재 위치까지의 동일 타입 개수를 계산
  if (nodeType && typeof nodeType === "function") {
    const typeName = nodeType.name || "Anonymous";

    // 현재 인덱스까지 동일 타입의 개수 계산
    let typeIndex = 0;
    for (let i = 0; i < index && i < (siblings?.length || 0); i++) {
      const sibling = siblings?.[i];
      if (sibling?.type === nodeType) {
        typeIndex++;
      }
    }

    return `${parentPath}.c${typeName}_${typeIndex}`;
  }

  return `${parentPath}.i${index}`;
};
