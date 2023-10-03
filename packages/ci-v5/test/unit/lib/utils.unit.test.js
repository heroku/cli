/* eslint-env mocha */

const nock = require('nock')
const expect = require('chai').expect
const Heroku = require('heroku-client')
const Utils = require('../../../lib/utils')
const Factory = require('./factory')

describe('Utils', function () {
  afterEach(() => nock.cleanAll())

  describe('#getPipeline', function () {
    it('disambiguates when passing a pipeline', async function () {
      const pipeline = Factory.pipeline
      const context = {flags: {pipeline: pipeline.id}}
      const api = nock('https://api.heroku.com')
        .get(`/pipelines/${pipeline.id}`)
        .reply(200, pipeline)

      const response = await Utils.getPipeline(context, new Heroku())
      expect(response).to.deep.eq(Factory.pipeline)
      api.done()
    })

    it('uses pipeline-couplings when passing an application', async function () {
      const app = '123-app'

      const coupling = {pipeline: Factory.pipeline}
      const context = {app, flags: {}}

      const api = nock('https://api.heroku.com')
        .get(`/apps/${app}/pipeline-couplings`)
        .reply(200, coupling)

      const response = await Utils.getPipeline(context, new Heroku())
      expect(response).to.deep.eq(Factory.pipeline)
      api.done()
    })
  })
})
