/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEmptyValue } from "../utils";
import { VNode } from "./types";
import { Fragment, TEXT_ELEMENT } from "./constants";

/**
 * 주어진 노드를 VNode 형식으로 정규화합니다.
 * null, undefined, boolean, 배열, 원시 타입 등을 처리하여 일관된 VNode 구조를 보장합니다.
 *
 */
export const normalizeNode = (node: unknown): VNode | null => {
  if (isEmptyValue(node)) return null;
  if (typeof node === "string" || typeof node === "number") {
    return createTextElement(String(node));
  }
  return node as VNode;
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
): VNode => {
  const flattenedChildren = flattenChildren(rawChildren);
  const children = flattenedChildren.map((child) => normalizeNode(child)).filter((child) => child !== null);

  if (type === Fragment) {
    return {
      type: Fragment,
      key: null,
      props: {
        children: children.length > 0 ? children : undefined,
      },
    };
  }
  const { key: maybeKey, ...props } = originProps ?? {};

  return {
    type,
    key: maybeKey ?? null,
    props: {
      ...props,
      children: children.length > 0 ? children : undefined,
    },
  } as VNode;
};

export const flattenChildren = (children: any[]): unknown[] => {
  return children.reduce((acc, child) => {
    if (Array.isArray(child)) {
      return acc.concat(flattenChildren(child));
    }
    return acc.concat(child);
  }, []);
};
/**
 * 부모 경로와 자식의 key/index를 기반으로 고유한 경로를 생성합니다.
 * 이는 훅의 상태를 유지하고 Reconciliation에서 컴포넌트를 식별하는 데 사용됩니다.
 */
export const createChildPath = () // parentPath: string,
// key: string | null,
// index: number,
// nodeType?: string | symbol | React.ComponentType,
// siblings?: VNode[],
: string => {
  // 여기를 구현하세요.
  return "";
};
