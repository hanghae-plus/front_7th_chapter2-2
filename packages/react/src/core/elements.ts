/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEmptyValue } from "../utils";
import { VNode } from "./types";
import { Fragment, TEXT_ELEMENT } from "./constants";

/**
 * 주어진 노드를 VNode 형식으로 정규화합니다.
 * null, undefined, boolean, 배열, 원시 타입 등을 처리하여 일관된 VNode 구조를 보장합니다.
 */
export const normalizeNode = (node: VNode): VNode | null => {
  // 여기를 구현하세요.

  // null, undefined, boolean은 렌더링하지 않음
  if (isEmptyValue(node)) {
    return null;
  }

  // 배열인 경우 Fragment로 감싸기
  if (Array.isArray(node)) {
    return createElement(Fragment, null, ...node);
  }

  // 원시 타입(string, number 등)은 텍스트 노드로 변환
  if (typeof node !== "object") {
    return createTextElement(node);
  }

  return node;
};

/**
 * 텍스트 노드를 위한 VNode를 생성합니다.
 */
const createTextElement = (node: VNode): VNode => {
  // 여기를 구현하세요.

  return {
    type: TEXT_ELEMENT,
    key: null,
    props: {
      nodeValue: String(node),
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
  // 여기를 구현하세요.

  const { key = null, ...props } = originProps || {};

  // children을 평탄화하고 정규화
  const flattenChildren = (children: any[]): VNode[] => {
    const result: VNode[] = [];

    for (const child of children) {
      if (Array.isArray(child)) {
        result.push(...flattenChildren(child));
      } else {
        const normalized = normalizeNode(child);
        if (normalized !== null) {
          result.push(normalized);
        }
      }
    }

    return result;
  };

  const children = flattenChildren(rawChildren);

  // children이 있을 때만 props에 추가
  if (children.length > 0) {
    return {
      type,
      key: key != null ? key : null,
      props: {
        ...props,
        children,
      },
    };
  }

  return {
    type,
    key: key != null ? key : null,
    props,
  };
};

/**
 * 부모 경로와 자식의 key/index를 기반으로 고유한 경로를 생성합니다.
 * 이는 훅의 상태를 유지하고 Reconciliation에서 컴포넌트를 식별하는 데 사용됩니다.
 */
export const createChildPath = (
  parentPath: string,
  key: string | number | null,
  index: number,
  nodeType?: string | symbol | React.ComponentType,
  siblings?: VNode[],
): string => {
  // 여기를 구현하세요.

  // key가 있으면 key 기반으로 경로 생성
  if (key != null) {
    return `${parentPath}/${key}`;
  }

  // key가 없으면 타입과 인덱스 기반으로 경로 생성
  // 같은 타입의 형제들 중에서의 인덱스를 계산
  if (siblings && nodeType) {
    const sameTypeIndex = siblings.slice(0, index).filter((sibling) => sibling && sibling.type === nodeType).length;

    let typeName: string;

    switch (typeof nodeType) {
      case "string":
        typeName = nodeType;
        break;
      case "symbol":
        typeName = nodeType.toString();
        break;
      case "function":
        typeName = (nodeType as any).displayName || (nodeType as any).name || "component";
        break;
      default:
        typeName = "component";
    }

    return `${parentPath}/${typeName}:${sameTypeIndex}`;
  }

  return `${parentPath}/${index}`;
};
