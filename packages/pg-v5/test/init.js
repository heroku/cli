'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

let cli = require('heroku-cli-util') // Load heroku-cli-util helpers
cli.raiseErrors = true // Fully raise exceptions
process.env.TZ = 'UTC' // Use UTC time always
process.env.IS_DEV_ENVIRONMENT = 'true'
process.stdout.columns = 80
process.stderr.columns = 80

let nock = require('nock')
nock.disableNetConnect()
if (process.env.ENABLE_NET_CONNECT === 'true') {
  nock.enableNetConnect()
}
