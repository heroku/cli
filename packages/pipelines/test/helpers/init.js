global.columns = 140

const {color} = require('@heroku-cli/color')
color.enabled = true

let nock = require('nock')
nock.disableNetConnect()
if (process.env.ENABLE_NET_CONNECT === true) {
  nock.enableNetConnect()
}
