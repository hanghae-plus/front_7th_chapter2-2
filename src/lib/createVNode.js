// {
//   type: 'div',
//   props: { id: 'app' },
//   children: ['안녕']
// }

export function createVNode(type, props, ...children) {
  return { type, props: props || {}, children };
}
