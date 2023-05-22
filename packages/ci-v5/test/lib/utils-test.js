/* eslint-env mocha */

const nock = require('nock')
const expect = require('chai').expect
const Heroku = require('heroku-client')
const Utils = require('../../lib/utils')
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

  describe('#dig', function () {
    it('is undefined given an undefined object', function () {
      expect(Utils.dig()).to.be.undefined
    })

    it('deep gets into an object', function () {
      const obj = {foo: {bar: 'baz'}}
      expect(Utils.dig(obj, 'foo', 'bar')).to.eq('baz')
    })

    it('deep gets into an array', function () {
      const array = [{foo: {bar: 'baz'}}]
      expect(Utils.dig(array, 0, 'foo', 'bar')).to.eq('baz')
    })

    it('returns undefined if the path is not present', function () {
      const obj = {foo: {bar: 'baz'}}
      expect(Utils.dig(obj, 'foo', 'quz')).to.be.undefined
    })
  })
})
