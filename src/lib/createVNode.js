function isRenderableChild(child) {
  return child !== null && child !== undefined && typeof child !== "boolean";
}

export function createVNode(type, props, ...children) {
  const normalizedChildren = children.flat(Infinity).filter(isRenderableChild);

  return { type, props: props ?? null, children: normalizedChildren };
}

// 기존
// return { type, props, children: children.flat() };
// 문제 1
// children.flat() 로 작성 시 children에서 중첩된 배열 구조가 나오면
// 1번째 중첩은 평탄화 해주었지만 2, 3번째 중첩은 평탄화 되지 않았음
// 해결
// return { type, props, children: children.flat(Infinity) }
// flat() 매개변수로 Infinity를 넘겨주어 모든 중첩을 평탄화 하도록 로직 작성

// 문제 2
// children에 null, undefined, boolean 값이 들어왔을 땐 가상돔에 포함되지 않아야 하는데 children 배열에 그대로 들어가는 문제
// 해결
// child !== null && child !== undefined && typeof child !== "boolean"
// 위 조건의 children 요소가 들어오면 평탄화된 children 배열에 들어가지 않도록 filter 메서드 사용
