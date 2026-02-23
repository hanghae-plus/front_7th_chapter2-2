/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEmptyValue } from "../utils";
import { VNode } from "./types";
import { Fragment, TEXT_ELEMENT } from "./constants";

/**
 * 주어진 노드를 VNode 형식으로 정규화합니다.
 * null, undefined, boolean, 배열, 원시 타입 등을 처리하여 일관된 VNode 구조를 보장합니다.
 */
export const normalizeNode = (node: VNode): VNode | null => {
  // null, undefined, boolean => null 반환(렌더링 안 함)
  if (isEmptyValue(node)) return null;

  // 문자열 / 숫자 => 텍스트 노드로 변환
  if (typeof node === "string" || typeof node === "number") {
    return createTextElement(node);
  }

  // 배열이면 createElement에서 처리하도록 null 반환
  if (Array.isArray(node)) {
    return null;
  }

  // VNode면 그대로 반환
  if (typeof node === "object" && node !== null) {
    return node;
  }

  return null;
};

/**
 * 텍스트 노드를 위한 VNode를 생성합니다.
 */
const createTextElement = (node: VNode): VNode => {
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
) => {
  // originProps에서 key만 분리하고,
  // key를 제외한 나머지 속성만 props에 남김
  const { key = null, ...props } = originProps ?? {};

  // children을 담을 배열
  const normalizedChildren: VNode[] = [];

  // 배열 평탄화
  const flat = rawChildren.flat(Infinity);
  // 배열 순회
  for (const child of flat) {
    // VNode 형식으로 정규화
    const normalized = normalizeNode(child);

    // null(렌더링 불가 값)인 경우 continue
    if (!normalized) continue;

    // Fragment type일 경우
    // children 요소 push
    if (normalized.type === Fragment) {
      const fragmentChildren = normalized.props?.children ?? [];
      normalizedChildren.push(...fragmentChildren);
    } else {
      // 그 외, 본인 node push
      normalizedChildren.push(normalized);
    }
  }

  // children이 없으면 props에 children을 넣지 않음
  if (normalizedChildren.length === 0) {
    return {
      type,
      key,
      props: {
        ...props,
      },
    };
  }

  return {
    type,
    key,
    props: {
      ...props,
      children: normalizedChildren,
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
  siblings: VNode[] = [],
): string => {
  const typeName =
    typeof nodeType === "string"
      ? `e${nodeType}`
      : typeof nodeType === "function"
        ? `c${nodeType.displayName || nodeType.name || "component"}`
        : typeof nodeType === "symbol"
          ? `s${nodeType.description ?? "symbol"}`
          : "f";

  if (key != null) {
    return `${parentPath}.k${key}.${typeName}`;
  }

  let occurrence = 0;
  for (let i = 0; i < index; i += 1) {
    const sibling = siblings[i];
    if (!sibling || sibling.key != null) continue;
    if (sibling.type === nodeType) {
      occurrence += 1;
    }
  }

  return `${parentPath}.i${occurrence}.${typeName}`;
};
