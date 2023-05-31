
/* eslint-env mocha */

const nock = require('nock')
const expect = require('chai').expect
const Heroku = require('heroku-client')
const herokuAPI = require('../../../lib/heroku-api')
const disambiguate = require('../../../lib/disambiguate')
const pipeline = {
  id: '123e4567-e89b-12d3-a456-426655440000',
  name: 'my-pipeline',
}

describe('disambiguate', function () {
  afterEach(() => nock.cleanAll())

  describe('#pipeline', function () {
    it('returns pipeline', async function () {
      const api = nock('https://api.heroku.com')
        .get(`/pipelines/${pipeline.id}`)
        .reply(200, pipeline)

      const response = await disambiguate(new Heroku(), pipeline.id)
      expect(response).to.deep.eq(pipeline)
      api.done()
    })
  })
})
