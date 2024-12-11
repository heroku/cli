import {APIClient} from '@heroku-cli/command'
import {Config} from '@oclif/core'
import {expect} from 'chai'
import * as nock from 'nock'
import {isCedarApp, isFirApp} from '../../../../src/lib/apps/generation'
import {App} from '../../../../src/lib/types/fir'

describe('app generation guard helper functions', function () {
  let api: nock.Scope
  let heroku: APIClient

  before(async function () {
    const config = await Config.load()
    heroku = new APIClient(config)
  })

  describe('isCedarApp with an app name (string) parameter', function () {
    beforeEach(async function () {
      api = nock('https://api.heroku.com', {
        reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'},
      })
    })

    afterEach(function () {
      api.done()
    })

    context('when the API client parameter is missing', function () {
      it('throws an error', async function () {
        try {
          await isCedarApp('my-app')
        } catch (error: unknown) {
          const {message} = error as Error
          expect(message).to.equal('herokuApi parameter is required when passing an app name')
        }
      })
    })

    context('when name targets a Cedar app', function () {
      it('makes a request for app info and returns true', async function () {
        api
          .get('/apps/my-app')
          .reply(200, {generation: 'cedar'})

        expect(await isCedarApp('my-app', heroku)).to.be.true
      })
    })

    context('when name targets a Fir app', function () {
      it('makes a request for app info and returns false', async function () {
        api
          .get('/apps/my-app')
          .reply(200, {generation: 'fir'})

        expect(await isCedarApp('my-app', heroku)).to.be.false
      })
    })
  })

  describe('isCedarApp with an App object parameter', function () {
    context('when object is a Cedar app', function () {
      it('returns true', async function () {
        expect(await isCedarApp({generation: 'cedar'} as App, heroku)).to.be.true
      })
    })

    context('when object is a Fir app', function () {
      it('returns false', async function () {
        expect(await isCedarApp({generation: 'fir'} as App, heroku)).to.be.false
      })
    })
  })

  describe('isFirApp with an app name (string) parameter', function () {
    beforeEach(async function () {
      api = nock('https://api.heroku.com', {
        reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'},
      })
    })

    afterEach(function () {
      api.done()
    })

    context('when the API client parameter is missing', function () {
      it('throws an error', async function () {
        try {
          await isFirApp('my-app')
        } catch (error: unknown) {
          const {message} = error as Error
          expect(message).to.equal('herokuApi parameter is required when passing an app name')
        }
      })
    })

    context('when name targets a Cedar app', function () {
      it('makes a request for app info and returns false', async function () {
        api
          .get('/apps/my-app')
          .reply(200, {generation: 'cedar'})

        expect(await isFirApp('my-app', heroku)).to.be.false
      })
    })

    context('when name targets a Fir app', function () {
      it('makes a request for app info and returns true', async function () {
        api
          .get('/apps/my-app')
          .reply(200, {generation: 'fir'})

        expect(await isFirApp('my-app', heroku)).to.be.true
      })
    })
  })

  describe('isFirApp with an App object parameter', function () {
    context('when object is a Cedar app', function () {
      it('returns false', async function () {
        expect(await isFirApp({generation: 'cedar'} as App, heroku)).to.be.false
      })
    })

    context('when object is a Fir app', function () {
      it('returns true', async function () {
        expect(await isFirApp({generation: 'fir'} as App, heroku)).to.be.true
      })
    })
  })
})
