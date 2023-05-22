/* globals afterEach */
const nock = require('nock')

nock.disableNetConnect()

afterEach(() => {
  nock.cleanAll()
})

process.stdout.columns = 80 // Set screen width for consistent wrapping
process.stderr.columns = 80 // Set screen width for consistent wrapping
