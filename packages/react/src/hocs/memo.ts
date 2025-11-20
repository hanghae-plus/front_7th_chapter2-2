import { useRef } from "../hooks";
import { type FunctionComponent, type VNode } from "../core";
import { shallowEquals } from "../utils";

/**
 * 컴포넌트의 props가 변경되지 않았을 경우, 마지막 렌더링 결과를 재사용하여
 * 리렌더링을 방지하는 고차 컴포넌트(HOC)입니다.
 *
 * @param Component - 메모이제이션할 컴포넌트
 * @param equals - props를 비교할 함수 (기본값: shallowEquals)
 * @returns 메모이제이션이 적용된 새로운 컴포넌트
 */
export function memo<P extends object>(Component: FunctionComponent<P>, equals = shallowEquals) {
  const MemoizedComponent: FunctionComponent<P> = (props) => {
    // useRef를 사용하여 이전 props와 렌더링 결과를 저장합니다.
    const ref = useRef<{ props: P; result: VNode | null } | null>(null);

    // 첫 렌더링이거나 props가 변경된 경우에만 컴포넌트를 다시 렌더링합니다.
    if (ref.current === null || !equals(ref.current.props, props)) {
      const result = Component(props);
      ref.current = { props, result };
      return result;
    }

    // props가 변경되지 않았으면 이전 렌더링 결과를 반환합니다.
    return ref.current.result;
  };

  MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name})`;

  return MemoizedComponent;
}
