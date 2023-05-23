'use strict'

module.exports = function (func, resolver) {
  var memoized = function () {
    const args = arguments
    const key = resolver.apply(this, args)
    const cache = memoized.cache

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = func.apply(this, args)

    result.then(function () {
      memoized.cache = cache.set(key, result) || cache
      return arguments
    })

    return result
  }

  memoized.clear = function () {
    memoized.cache = new Map()
  }

  memoized.clear()

  return memoized
}
