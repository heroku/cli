const path = require('path')

globalThis.setInterval = () => ({unref: () => {}})
const tm = globalThis.setTimeout
globalThis.setTimeout = cb => {
  return tm(cb)
}

process.env.TS_NODE_PROJECT = path.resolve('test/tsconfig.json')
// Env var used to prevent some expensive
// prerun and postrun hooks from initializing
process.env.IS_HEROKU_TEST_ENV = 'true'

let nock = require('nock')
nock.disableNetConnect()
if (process.env.ENABLE_NET_CONNECT === 'true') {
  nock.enableNetConnect()
}

const chai = require('chai')
chai.use(require('chai-as-promised'))
