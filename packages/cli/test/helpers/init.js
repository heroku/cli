const path = require('path')
process.env.TS_NODE_PROJECT = path.resolve('test/tsconfig.json')

let nock = require('nock')
nock.disableNetConnect()
if (process.env.ENABLE_NET_CONNECT === 'true') {
  nock.enableNetConnect()
}
