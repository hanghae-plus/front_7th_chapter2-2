/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEmptyValue } from "../utils";
import { VNode } from "./types";
import { Fragment, TEXT_ELEMENT } from "./constants";

/**
 * 주어진 노드를 VNode 형식으로 정규화합니다.
 * null, undefined, boolean, 배열, 원시 타입 등을 처리하여 일관된 VNode 구조를 보장합니다.
 */
export const normalizeNode = (node: VNode): VNode | null => {
  // null, undefined, boolean은 렌더링하지 않음
  if (isEmptyValue(node)) {
    return null;
  }

  // 배열인 경우 Fragment로 감싸기
  if (Array.isArray(node)) {
    return createElement(Fragment, null, ...node);
  }

  // 이미 VNode 형식이면 그대로 반환
  if (typeof node === "object" && node !== null && "type" in node) {
    return node;
  }

  // 원시 타입(문자열, 숫자)은 텍스트 노드로 변환
  if (typeof node === "string" || typeof node === "number") {
    return createTextElement(String(node));
  }

  return null;
};

/**
 * 텍스트 노드를 위한 VNode를 생성합니다.
 */
const createTextElement = (text: string): VNode => {
  return {
    type: TEXT_ELEMENT,
    key: null,
    props: {
      nodeValue: text,
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
  // props에서 key 추출 (key는 특별한 속성)
  const { key = null, ...props } = originProps || {};

  // children 배열을 평탄화하고 정규화
  const flattenChildren = (children: any[]): VNode[] => {
    const result: VNode[] = [];

    for (const child of children) {
      if (Array.isArray(child)) {
        // 중첩 배열 평탄화
        result.push(...flattenChildren(child));
      } else {
        // 각 자식을 정규화
        const normalized = normalizeNode(child);
        if (normalized !== null) {
          result.push(normalized);
        }
      }
    }

    return result;
  };

  const children = flattenChildren(rawChildren);

  const finalProps: Record<string, any> = { ...props };

  // children이 있을 때만 추가
  if (children.length > 0) {
    finalProps.children = children;
  }

  return {
    type,
    key,
    props: finalProps,
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
  // key가 있으면 key 기반 경로 생성
  if (key !== null) {
    return `${parentPath}.k${key}`;
  }

  // 타입 식별자 생성
  let typeId = "";
  if (nodeType) {
    if (typeof nodeType === "string") {
      typeId = `t${nodeType}`;
    } else if (typeof nodeType === "symbol") {
      typeId = `s${nodeType.toString()}`;
    } else if (typeof nodeType === "function") {
      typeId = `c${nodeType.name || "anonymous"}`;
    }
  }

  // siblings가 있으면 같은 타입의 컴포넌트 중 몇 번째인지 계산
  // 이렇게 하면 다른 타입의 형제가 추가/삭제되어도 경로가 유지됨
  if (siblings && nodeType) {
    let typeIndex = 0;
    for (let i = 0; i < index; i++) {
      if (siblings[i] && siblings[i].type === nodeType) {
        typeIndex++;
      }
    }
    return `${parentPath}.${typeId}.${typeIndex}`;
  }

  // siblings가 없으면 기존 방식 (전체 인덱스 사용)
  return `${parentPath}.i${index}${typeId ? `.${typeId}` : ""}`;
};
