'use strict'
let cli = require('heroku-cli-util')

let Stream = function (url) {
  return new Promise(function (resolve, reject) {
    let stream = cli.got.stream(url)
    stream.on('error', reject)
    stream.on('end', resolve)
    let piped = stream.pipe(process.stdout)
    piped.on('error', reject)
  })
}

module.exports = {
  Stream
}
