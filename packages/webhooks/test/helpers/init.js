// hardcodes `columns` terminal width for tests which is
// important for things like tables and other places where
// dynamic wrapping or truncating is an issue.
// see: https://github.com/oclif/screen

global.columns = 140

// disable color for tests
const {color} = require('@heroku-cli/color')
color.enabled = false

let nock = require('nock')

nock.disableNetConnect()
if (process.env.ENABLE_NET_CONNECT === 'true') {
  nock.enableNetConnect()
}
