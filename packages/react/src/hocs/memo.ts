import { useRef } from "../hooks";
import { type FunctionComponent, type VNode } from "../core";
import { shallowEquals } from "../utils";

export function memo<P extends object>(Component: FunctionComponent<P>, equals = shallowEquals) {
  const MemoizedComponent: FunctionComponent<P> = (props) => {
    const prevPropsRef = useRef<P | null>(null);
    const memoizedResultRef = useRef<VNode | null>(null);

    if (prevPropsRef.current === null || !equals(prevPropsRef.current, props)) {
      memoizedResultRef.current = Component(props);
    }
    prevPropsRef.current = props;
    return memoizedResultRef.current;
  };

  MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name})`;

  return MemoizedComponent;
}
