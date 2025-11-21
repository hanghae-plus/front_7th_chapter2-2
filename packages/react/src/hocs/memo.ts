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
  // 클로저로 캐시 저장 (hooks 사용 불가 - HOC는 매번 새 인스턴스 생성됨)
  let cache: { props: P; result: VNode } | null = null;

  const MemoizedComponent: FunctionComponent<P> = (props) => {
    if (!cache || !equals(cache.props, props)) {
      cache = {
        props,
        result: Component(props),
      };
    }

    return cache.result;
  };

  MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name})`;

  return MemoizedComponent;
}
