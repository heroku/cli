import path from 'path'
import nock from 'nock'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

globalThis.setInterval = () => ({unref: () => {}})
const tm = globalThis.setTimeout
globalThis.setTimeout = cb => {
  return tm(cb)
}

process.env.TS_NODE_PROJECT = path.resolve('test/tsconfig.json')
// Env var used to prevent some expensive
// prerun and postrun hooks from initializing
process.env.IS_HEROKU_TEST_ENV = 'true'

process.env.HEROKU_SKIP_NEW_VERSION_CHECK = 'true'

nock.disableNetConnect()
if (process.env.ENABLE_NET_CONNECT === 'true') {
  nock.enableNetConnect()
}

chai.use(chaiAsPromised)

// Disable truncation of assertion error messages
chai.config.truncateThreshold = 0
