// copied from plugin-pipelines-v5
module.exports = function keyBy(list, propertyOrCb) {
  const isCallback = typeof propertyOrCb === 'function'

  // eslint-disable-next-line unicorn/prefer-object-from-entries
  return list.reduce((memo, item) => {
    const key = isCallback ? propertyOrCb(item) : item[propertyOrCb]
    memo[key] = item
    return memo
  }, {})
}
