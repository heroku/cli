const {color} = require('@heroku-cli/color')
color.enabled = false

process.stdout.columns = 80
process.stderr.columns = 80

let nock = require('nock')
nock.disableNetConnect()
if (process.env.ENABLE_NET_CONNECT === true) {
  nock.enableNetConnect()
}
