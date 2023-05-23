'use strict'

function promisfy(mod, fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments)
    return new Promise(function (resolve, reject) {
      args.push(function (err, res) {
        if (err) reject(err)
        else resolve(res)
      })
      mod[fn].apply(mod, args)
    })
  }
}

module.exports = promisfy(require('fs'), 'readFile')
