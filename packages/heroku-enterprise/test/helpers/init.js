const path = require('path')
const { color } = require('@heroku-cli/color')

process.env.TS_NODE_PROJECT = path.resolve('test/tsconfig.json')
global.columns = '80'
color.enabled = false
