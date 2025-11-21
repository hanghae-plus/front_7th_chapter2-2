/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEmptyValue } from "../utils";
import { FunctionComponent, VNode } from "./types";
import { Fragment, TEXT_ELEMENT } from "./constants";

/**
 * 주어진 노드를 VNode 형식으로 정규화합니다.
 * null, undefined, boolean, 배열, 원시 타입 등을 처리하여 일관된 VNode 구조를 보장합니다.
 */
export const normalizeNode = (node: string | number | boolean | null | VNode | undefined): VNode | null => {
  if (isEmptyValue(node)) return null;

  if (typeof node === "object" && node !== null && "type" in node) return node;

  if (typeof node === "string" || typeof node === "number") return createTextElement(String(node));

  return null;
};

/**
 * 텍스트 노드를 위한 VNode를 생성합니다.
 */
const createTextElement = (node: string): VNode => {
  return {
    type: TEXT_ELEMENT,
    key: null,
    props: {
      nodeValue: node,
      children: [],
    },
  };
};

/**
 * JSX로부터 전달된 인자를 VNode 객체로 변환합니다.
 * 이 함수는 JSX 변환기에 의해 호출됩니다. (예: Babel, TypeScript)
 */
export const createElement = (
  type: string | symbol | React.ComponentType<any>,
  originProps?: Record<string, any> | null,
  ...rawChildren: any[]
) => {
  if (type === Fragment) {
    const flatChildren = rawChildren.flat(Infinity);
    const children = flatChildren.map(normalizeNode).filter((child): child is VNode => child !== null);
    return {
      type: Fragment,
      key: null,
      props: {
        children,
      },
    };
  }

  const { key = null, ...restProps } = originProps || {};

  const flatChildren = rawChildren.flat(Infinity);

  const children = flatChildren.map(normalizeNode).filter((child): child is VNode => child !== null);

  return {
    type,
    key: key ?? null,
    props: {
      ...restProps,
      ...(children.length > 0 ? { children } : {}),
    },
  };
};

/**
 * 부모 경로와 자식의 key/index를 기반으로 고유한 경로를 생성합니다.
 * 이는 훅의 상태를 유지하고 Reconciliation에서 컴포넌트를 식별하는 데 사용됩니다.
 */
export const createChildPath = (
  parentPath: string,
  key: string | null,
  index: number,
  nodeType?: string | symbol | React.ComponentType,
  siblings?: VNode[],
): string => {
  if (key !== null) return `${parentPath}.k${key}`;

  if (typeof nodeType === "function") {
    const componentFunction = nodeType as FunctionComponent<any>;
    const componentName = componentFunction.displayName || componentFunction.name || "Component";

    let typeIndex = 0;
    if (siblings) {
      for (let i = 0; i < index; i++) {
        if (siblings[i]?.type === nodeType) typeIndex++;
      }
    }

    return `${parentPath}.c${componentName}_${typeIndex}`;
  }

  return `${parentPath}.i${index}`;
};
