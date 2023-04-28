'use strict'

let stream = require('stream')

// this splits a stream into lines
let transform = new stream.Transform({decodeStrings: false})
transform._transform = function (chunk, encoding, next) {
  let data = chunk
  if (this._lastLineData) data = this._lastLineData + data

  let lines = data.split('\n')
  // eslint-disable-next-line unicorn/prefer-negative-index
  this._lastLineData = lines.splice(lines.length - 1, 1)[0]

  lines.forEach(this.push.bind(this))
  next()
}

transform._flush = function (done) {
  if (this._lastLineData) this.push(this._lastLineData)
  this._lastLineData = null
  done()
}

module.exports = transform
