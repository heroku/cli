export default function keyBy(list: any, propertyOrCb: any) {
  const isCallback = typeof propertyOrCb === 'function'

  // eslint-disable-next-line unicorn/no-array-reduce, unicorn/prefer-object-from-entries
  return list.reduce((memo: any, item: any) => {
    const key = isCallback ? propertyOrCb(item) : item[propertyOrCb]
    memo[key] = item
    return memo
  }, {})
}
