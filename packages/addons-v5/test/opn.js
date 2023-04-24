'use strict'

let opn = function (url) {
  opn.url = url
  // eslint-disable-next-line no-promise-executor-return
  return new Promise(resolve => resolve())
}

module.exports = opn
