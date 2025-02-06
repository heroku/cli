import {expect} from 'chai'
import {APIClient} from '@heroku-cli/command'
import * as nock from 'nock'
import {getGeneration, getGenerationByAppId} from '../../../../src/lib/apps/generation'
import {Config} from '@oclif/core'

describe('generation', function () {
  describe('getGeneration', function () {
    it('identifies fir generation from string format web-xxxxxxxxx-xxxxx', function () {
      expect(getGeneration('web-abc56789ee1-12345')).to.equal('fir')
    })

    it('identifies cedar generation from string format web.n', function () {
      expect(getGeneration('web.0')).to.equal('cedar')
      expect(getGeneration('web.100')).to.equal('cedar')
    })

    it('identifies fir generation from object with generation property', function () {
      const app = {generation: 'fir'}
      expect(getGeneration(app)).to.equal('fir')
    })

    it('identifies cedar generation from object with generation property', function () {
      const app = {generation: 'cedar'}
      expect(getGeneration(app)).to.equal('cedar')
    })

    it('returns undefined for invalid generation format', function () {
      expect(getGeneration('invalid-format')).to.be.undefined
    })

    it('handles undefined generation', function () {
      const app = {generation: undefined}
      expect(getGeneration(app)).to.be.undefined
    })
  })

  describe('getGenerationByAppId', function () {
    beforeEach(function () {
      nock.cleanAll()
    })

    it('fetches and returns fir generation for app', async function () {
      const config = await Config.load()
      const api = new APIClient(config)
      const app = {generation: 'fir'}

      nock('https://api.heroku.com')
        .get('/apps/test-app')
        .reply(200, app)

      const generation = await getGenerationByAppId('test-app', api)
      expect(generation).to.equal('fir')
    })

    it('fetches and returns cedar generation for app', async function () {
      const config = await Config.load()
      const api = new APIClient(config)
      const app = {generation: 'cedar'}

      nock('https://api.heroku.com')
        .get('/apps/test-app')
        .reply(200, app)

      const generation = await getGenerationByAppId('test-app', api)
      expect(generation).to.equal('cedar')
    })

    it('handles app without generation', async function () {
      const config = await Config.load()
      const api = new APIClient(config)
      const app = {}

      nock('https://api.heroku.com')
        .get('/apps/test-app')
        .reply(200, app)

      const generation = await getGenerationByAppId('test-app', api)
      expect(generation).to.be.undefined
    })
  })
})
