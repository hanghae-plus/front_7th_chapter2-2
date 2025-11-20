/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEmptyValue } from "../utils";
import { VNode } from "./types";
import { TEXT_ELEMENT } from "./constants";

/**
 * 주어진 노드를 VNode 형식으로 정규화합니다.
 * null, undefined, boolean, 배열, 원시 타입 등을 처리하여 일관된 VNode 구조를 보장합니다.
 */
export const normalizeNode = (node: VNode): VNode | null => {
  // 렌더링되지 않아야 하는 값들 (null, undefined, boolean)을 필터링
  if (isEmptyValue(node)) {
    return null;
  }

  // 배열인 경우: 재귀적으로 정규화하지 않고 그대로 반환 (createElement에서 처리)
  if (Array.isArray(node)) {
    return node as unknown as VNode;
  }

  // 이미 VNode 객체인 경우 (type 속성이 있는 경우)
  if (typeof node === "object" && node !== null && "type" in node) {
    return node;
  }

  // 원시 타입 (string, number 등)은 텍스트 노드로 변환
  if (typeof node === "string" || typeof node === "number") {
    return createTextElement(node);
  }

  // 그 외의 경우 null 반환
  return null;
};

/**
 * 텍스트 노드를 위한 VNode를 생성합니다.
 */
const createTextElement = (node: VNode): VNode => {
  // TEXT_ELEMENT 심볼을 타입으로 사용하여 텍스트 노드를 생성
  // nodeValue 속성에 실제 텍스트 값을 저장
  return {
    type: TEXT_ELEMENT,
    key: null,
    props: {
      children: [],
      nodeValue: String(node), // 숫자 등도 문자열로 변환
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
  // props에서 key를 추출하고 나머지 props를 분리
  const { key = null, ...props } = originProps || {};

  // 자식 배열을 평탄화하고 정규화
  // rawChildren은 중첩된 배열일 수 있으므로 flat(Infinity)로 완전히 평탄화
  const flatChildren = rawChildren.flat(Infinity);

  // 각 자식을 normalizeNode로 정규화하고 null이 아닌 것만 필터링
  const children = flatChildren.map((child) => normalizeNode(child)).filter((child) => child !== null);

  // VNode 객체 반환
  // key를 원본 타입 그대로 유지 (숫자, 문자열 등)
  const normalizedKey = key === null || key === undefined ? null : key;

  // children이 있을 때만 props에 추가
  const nodeProps = children.length > 0 ? { ...props, children } : { ...props };

  return {
    type,
    key: normalizedKey,
    props: nodeProps,
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
  // key가 있는 경우: "parentPath.k{key}" 형식 사용
  // key를 문자열로 변환하여 경로에 사용
  if (key !== null) {
    return `${parentPath}.k${String(key)}`;
  }

  // key가 없는 경우: 타입 기반 카운터 사용
  // 같은 타입의 형제 노드들 중 몇 번째인지 계산
  if (nodeType && siblings) {
    // 현재 노드 이전의 같은 타입 형제들의 개수를 세어 타입별 인덱스 계산
    let typeIndex = 0;
    for (let i = 0; i < index; i++) {
      if (siblings[i]?.type === nodeType) {
        typeIndex++;
      }
    }

    // 타입명 추출 (함수면 이름, 심볼이면 설명, 문자열이면 그대로)
    let typeName: string;
    if (typeof nodeType === "function") {
      typeName = nodeType.name || "Anonymous";
    } else if (typeof nodeType === "symbol") {
      typeName = nodeType.description || "Symbol";
    } else {
      typeName = String(nodeType);
    }

    // "parentPath.c{TypeName}_{typeIndex}" 형식 사용
    return `${parentPath}.c${typeName}_${typeIndex}`;
  }

  // 타입 정보가 없는 경우: 단순히 인덱스 사용
  return `${parentPath}.i${index}`;
};
