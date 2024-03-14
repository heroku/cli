'use strict'

let opn = function (url) {
  opn.url = url
  return new Promise(resolve => resolve())
}

module.exports = opn
