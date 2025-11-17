export function createVNode(type, props, ...children) {
  return {
    type,
    props,
    children: children
      .flat(Infinity)
      .filter((child) => child !== null && child !== undefined && child !== false && child !== true),
  };
}

/**
  .flat(Infinity) → 모든 깊이의 배열 평탄화를 왜 해야할까?

  .flat()만 했을 때

  <ul>
  {categories.map(cat => 
    cat.items.map(item => <li>{item}</li>)
  )}
  </ul>

  출력: 
  [
    [
      [<li>1</li>, <li>2</li>],
      [<li>3</li>, <li>4</li>]
    ]
  ]

  .flat(Infinity) 로 모든 깊이를 평탄화
  [<li>1</li>, <li>2</li>, <li>3</li>, <li>4</li>]
 */
