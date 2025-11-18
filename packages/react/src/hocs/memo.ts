import { type FunctionComponent, type VNode } from "../core";
import { useRef } from "../hooks";
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
    // useRef를 사용하여 이전 props와 렌더링 결과를 저장해야 합니다.
    const ref = useRef<{ prevProps: P | null; result: VNode | null }>({ prevProps: null, result: null });

    // equals 함수로 이전 props와 현재 props를 비교하여 렌더링 여부를 결정합니다.
    if (!ref.current.prevProps || !equals(ref.current.prevProps, props)) {
      ref.current.result = Component(props);
    }

    // 이전 props를 항상 현재 props로 업데이트합니다.
    ref.current.prevProps = props;

    // props가 동일하면 이전 렌더링 결과를 재사용합니다.
    return ref.current.result;
  };

  MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name})`;

  return MemoizedComponent;
}
