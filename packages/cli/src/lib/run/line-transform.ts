/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as stream from 'stream'

// this splits a stream into lines
const transform = new stream.Transform({decodeStrings: false})

transform._transform = function (chunk, _encoding, next) {
  let data = chunk
  // @ts-ignore
  if (this._lastLineData) data = this._lastLineData + data

  const lines = data.split('\n')
  // @ts-ignore
  this._lastLineData = lines.splice(-1, 1)[0]

  lines.forEach(this.push.bind(this))
  next()
}

transform._flush = function (done) {
  // @ts-ignore
  if (this._lastLineData) this.push(this._lastLineData)
  // @ts-ignore
  this._lastLineData = null
  done()
}

export default transform
