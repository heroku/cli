const path = require('path')
process.env.TS_NODE_PROJECT = path.resolve('test/tsconfig.json')

let nock = require('nock')
nock.disableNetConnect()
console.log('ENABLE_NET_CONNECT', process.env.ENABLE_NET_CONNECT)
if (process.env.ENABLE_NET_CONNECT === true) {
  nock.enableNetConnect()
}
