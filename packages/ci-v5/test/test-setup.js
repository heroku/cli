/* eslint-env mocha */
const nock = require('nock')

beforeEach(function () {
  nock.disableNetConnect()
})

afterEach(function () {
  nock.cleanAll()
  nock.enableNetConnect()
})
