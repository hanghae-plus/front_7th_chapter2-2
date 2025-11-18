/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEmptyValue } from "../utils";
import { Fragment, TEXT_ELEMENT } from "./constants";
import { VNode } from "./types";

/**
 * 주어진 노드를 VNode 형식으로 정규화합니다.
 * null, undefined, boolean, 배열, 원시 타입 등을 처리하여 일관된 VNode 구조를 보장합니다.
 */
export const normalizeNode = (node: any): VNode | null => {
  if (isEmptyValue(node)) return null;
  if (Array.isArray(node)) return createElement(Fragment, null, ...node);
  if (typeof node !== "object") return createTextElement(node);

  return { ...node, props: node.props ?? null, key: node.key ?? null } as VNode;
};

/**
 * 텍스트 노드를 위한 VNode를 생성합니다.
 */
const createTextElement = (node: unknown): VNode => ({
  type: TEXT_ELEMENT,
  key: null,
  props: {
    children: [],
    nodeValue: String(node),
  },
});

/**
 * JSX로부터 전달된 인자를 VNode 객체로 변환합니다.
 * 이 함수는 JSX 변환기에 의해 호출됩니다. (예: Babel, TypeScript)
 */
export const createElement = (
  type: string | symbol | React.ComponentType<any>,
  originProps?: Record<string, any> | null,
  ...rawChildren: any[]
) => {
  const { key = null, ...restProps } = originProps || {};
  const props: Record<string, any> = { ...restProps };

  const flatChildren = rawChildren.flat(Infinity);
  const children: VNode[] = [];

  for (const child of flatChildren) {
    const node = normalizeNode(child);
    if (node) children.push(node);
  }

  if (children.length) props.children = children;

  return { type, key, props } as VNode;
};

/**
 * 부모 경로와 자식의 key/index를 기반으로 고유한 경로를 생성합니다.
 * 이는 훅의 상태를 유지하고 Reconciliation에서 컴포넌트를 식별하는 데 사용됩니다.
 *
 * 경로 형식:
 * - key가 있으면: `parentPath.k${encodedKey}`
 * - key가 없으면:
 *   - DOM 요소: `i${index}` (인덱스 기반)
 *   - Fragment: `f${count}` (같은 타입의 개수)
 *   - 함수 컴포넌트: `c${componentName}_${count}` (컴포넌트 이름 + 같은 타입의 개수)
 */
export const createChildPath = (
  parentPath: string,
  key: string | null,
  index: number,
  nodeType?: string | symbol | React.ComponentType,
  siblings?: VNode[],
): string => {
  // key가 있으면 key 기반 경로 생성 (특수 문자 인코딩)
  if (key != null) {
    const encodedKey = encodeURIComponent(String(key));
    return parentPath ? `${parentPath}.k${encodedKey}` : `k${encodedKey}`;
  }

  // key가 없으면 타입에 따라 다른 형식 사용
  const prevSiblings = siblings?.slice(0, index) ?? [];
  const targetType = nodeType === Fragment ? Fragment : nodeType;

  // Fragment는 'f' 접두사와 같은 타입의 개수 사용
  if (nodeType === Fragment) {
    const count = prevSiblings.filter((sibling) => sibling && sibling.type === Fragment && sibling.key == null).length;
    const token = `f${count}`;
    return parentPath ? `${parentPath}.${token}` : token;
  }

  // 함수 컴포넌트는 'c' 접두사와 컴포넌트 이름 사용
  if (nodeType && typeof nodeType === "function") {
    const componentName = (nodeType as React.ComponentType).name || "Anonymous";
    const count = prevSiblings.filter(
      (sibling) => sibling && sibling.type === targetType && sibling.key == null,
    ).length;
    const token = `c${componentName}_${count}`;
    return parentPath ? `${parentPath}.${token}` : token;
  }

  // DOM 요소나 기타 타입은 인덱스 기반
  const token = `i${index}`;
  return parentPath ? `${parentPath}.${token}` : token;
};
