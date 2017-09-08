const nock = require('nock')

nock.disableNetConnect()

afterEach(() => {
  nock.cleanAll()
})
