const nock = require('nock')

nock.disableNetConnect()

// eslint-disable-next-line no-undef
afterEach(() => {
  nock.cleanAll()
})

process.stdout.columns = 80 // Set screen width for consistent wrapping
process.stderr.columns = 80 // Set screen width for consistent wrapping
