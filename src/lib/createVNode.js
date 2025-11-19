/**
 * 배열을 재귀적으로 완전히 평탄화하고 falsy 값 필터링
 * @param {Array} arr - 평탄화할 배열
 * @returns {Array} - 완전히 평탄화되고 falsy 값이 제거된 배열
 */
function flattenDeep(arr) {
  return arr.reduce((flat, item) => {
    // null, undefined, boolean(false)은 제외
    if (item == null || item === false) {
      return flat;
    }

    // 배열인 경우 재귀적으로 평탄화
    if (Array.isArray(item)) {
      return flat.concat(flattenDeep(item));
    }

    // 배열이 아니면 그대로 추가
    return flat.concat(item);
  }, []);
}

//이 함수가 jsx를 VNode로 변환(jsx 주석을 통해 명시적 지정)
export function createVNode(type, props, ...children) {
  if (type === "input") {
    console.log("type", type, props);
  }
  return {
    type,
    props,
    children: flattenDeep(children),
  };
}
