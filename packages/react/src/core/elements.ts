/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEmptyValue } from "../utils";
import { VNode } from "./types";
import { Fragment, TEXT_ELEMENT } from "./constants";

/**
 * 주어진 노드를 VNode 형식으로 정규화합니다.
 * null, undefined, boolean, 배열, 원시 타입 등을 처리하여 일관된 VNode 구조를 보장합니다.
 */
export const normalizeNode = (node: any): VNode | null => {
  /* 1. 빈 값(null, undefined, boolean)은 null 반환 */
  if (isEmptyValue(node)) {
    return null;
  }

  /* 2. 배열은 Fragment로 감싸기 (재귀적으로 normalizeNode 호출) */
  if (Array.isArray(node)) {
    return createElement(Fragment, null, ...node);
  }

  /* 3. 문자열이나 숫자는 텍스트 노드로 변환 */
  if (typeof node === "string" || typeof node === "number") {
    return createTextElement(node);
  }

  /* 4. 이미 VNode 형식이면 그대로 반환 */
  return node as VNode;
};

/**
 * 텍스트 노드를 위한 VNode를 생성합니다.
 */
const createTextElement = (text: string | number): VNode => {
  /* 문자열이나 숫자를 TEXT_ELEMENT 타입의 VNode로 변환 */
  /* 텍스트 노드는 children이 없으므로 빈 배열 */
  return {
    type: TEXT_ELEMENT,
    key: null,
    props: {
      nodeValue: String(text), // 숫자도 문자열로 변환
      children: [], // 텍스트 노드는 children 없음
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
  /* 1. props 처리 - key는 별도로 추출 */
  const { key = null, ...props } = originProps || {};

  /* 2. children 평탄화 및 정규화 */
  const children = rawChildren
    .flat(Infinity) // 중첩 배열 평탄화 (예: [[1, 2], 3] → [1, 2, 3])
    .map(normalizeNode) // 각 child를 VNode로 정규화
    .filter((child) => child !== null); // null 제거

  /* 3. VNode 객체 생성 및 반환 */
  return {
    type,
    key: key ?? null, // key 타입 그대로 유지 (숫자면 숫자, 문자열이면 문자열)
    props:
      children.length > 0
        ? {
            ...props,
            children, // children이 있을 때만 포함
          }
        : props, // children이 없으면 props만
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
  // siblings?: VNode[],
): string => {
  // 여기를 구현하세요.

  /* 1. key가 있으면 key 사용 (React의 key prop) */
  if (key !== null) {
    return `${parentPath}.${key}`;
  }

  /* 2. 함수 컴포넌트면 'c'(component) prefix 사용 */
  if (typeof nodeType === "function") {
    return `${parentPath}.c${index}`;
  }

  /* 3. 일반 요소는 인덱스만 사용 */
  return `${parentPath}.${index}`;
};

/**
 * JSX Runtime exports for automatic JSX transformation
 */
export { createElement as jsx, createElement as jsxs, Fragment };
