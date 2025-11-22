export function createVNode(type, props, ...children) {
  return {
    type: type,
    props: props,
    children: filterTruthy(children.flat(Infinity)),
  };
}

function filterTruthy(children) {
  return children.filter((child) => {
    if (child === false) return false;
    if (child === null) return false;
    if (child === undefined) return false;
    return true;
  });
}
