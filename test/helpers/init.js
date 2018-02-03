process.env.TS_NODE_PROJECT = 'test'

// import {cli} from 'cli-ux'
// import * as nock from 'nock'
// import * as path from 'path'

// import inc from './count'

const nock = require('nock')

process.setMaxListeners(0)

process.env.FORCE_COLOR = '0'

global.columns = 80
global.testing = true

nock.disableNetConnect()
// cli.config.mock = true

// let count = await inc()
// let root = path.join(__dirname, '../../tmp/test')

// process.env.HEROKU_DATA_DIR = path.join(root, `test-${count}`, 'data')
// process.env.HEROKU_CACHE_DIR = path.join(root, 'cache')
// process.env.HEROKU_CONFIG_DIR = path.join(root, `test-${count}`, 'config')

// export const skipIfWindows = process.platform === 'win32' ? test.skip : test
