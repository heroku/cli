const path = require('path')

globalThis.setInterval = () => ({unref: () => {}})
const tm = globalThis.setTimeout
globalThis.setTimeout = cb => {
  return tm(cb)
}

process.env.TS_NODE_PROJECT = path.resolve('test/tsconfig.json')
process.env.IS_HEROKU_TEST_ENV = 'true'

let nock = require('nock')
nock.disableNetConnect()
if (process.env.ENABLE_NET_CONNECT === 'true') {
  nock.enableNetConnect()
}
