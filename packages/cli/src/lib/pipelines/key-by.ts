export default function keyBy(list: any, propertyOrCb: any) {
  const isCallback = typeof propertyOrCb === 'function'

  return list.reduce((memo: any, item: any) => {
    const key = isCallback ? propertyOrCb(item) : item[propertyOrCb]
    memo[key] = item
    return memo
  }, {})
}
