/* eslint-env mocha */

const nock = require('nock')
const expect = require('chai').expect
const Heroku = require('heroku-client')
const herokuAPI = require('../../lib/heroku-api')

describe('heroku-api', function () {
  afterEach(() => nock.cleanAll())

  describe('#pipelineCoupling', function () {
    it('gets the pipeline coupling given an app', function* () {
      const app = 'sausages'
      const coupling = { pipeline: { id: '123-abc' } }
      const api = nock(`https://api.heroku.com`)
        .get(`/apps/${app}/pipeline-couplings`)
        .reply(200, coupling)

      const response = yield herokuAPI.pipelineCoupling(new Heroku(), app)
      expect(response).to.deep.eq(coupling)
      api.done()
    })
  })

  describe('#pipelineRepository', function () {
    it('gets the pipeline repository given a pipeline', function* () {
      const pipeline = '123-abc'
      const repo = { repository: { name: 'heroku/heroku' } }
      const api = nock(`https://kolkrabbi.herokuapp.com`)
        .get(`/pipelines/${pipeline}/repository`)
        .reply(200, repo)

      const response = yield herokuAPI.pipelineRepository(new Heroku(), pipeline)
      expect(response).to.deep.eq(repo)
      api.done()
    })
  })

  describe('#testRun', function () {
    it('gets a test run given a pipeline and number', function* () {
      const pipeline = '123-abc'
      const number = 1
      const testRun = { number }
      const api = nock(`https://api.heroku.com`)
        .get(`/pipelines/${pipeline}/test-runs/${number}`)
        .matchHeader('Accept', 'application/vnd.heroku+json; version=3.ci')
        .reply(200, testRun)

      const response = yield herokuAPI.testRun(new Heroku(), pipeline, number)
      expect(response).to.deep.eq(testRun)
      api.done()
    })
  })
})
