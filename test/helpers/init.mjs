/* eslint-disable import/no-named-as-default-member */
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import nock from 'nock'
import path from 'path'
import {fileURLToPath} from 'url'

globalThis.setInterval = () => ({unref() {}})
const tm = globalThis.setTimeout
globalThis.setTimeout = cb => tm(cb)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')

process.env.OCLIF_TEST_ROOT = root
process.env.TS_NODE_PROJECT = path.resolve('test/tsconfig.json')
// Env var used to prevent some expensive
// prerun and postrun hooks from initializing
process.env.IS_HEROKU_TEST_ENV = 'true'

process.env.HEROKU_SKIP_NEW_VERSION_CHECK = 'true'

process.env.HEROKU_DATA_CONTROL_PLANE = 'test-control-plane'

// Set terminal size for tests to 200x50
process.env.COLUMNS = '200'
process.env.LINES = '50'
process.stdout.columns = 200
process.stdout.rows = 50
process.stderr.columns = 200
process.stderr.rows = 50

nock.disableNetConnect()
if (process.env.ENABLE_NET_CONNECT === 'true') {
  nock.enableNetConnect()
}

chai.use(chaiAsPromised)

// Disable truncation of assertion error messages
chai.config.truncateThreshold = 0
