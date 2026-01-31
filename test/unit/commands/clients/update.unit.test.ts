import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('clients:update', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  context('with a name flag', function () {
    it('updates the client name', async function () {
      api
        .patch('/oauth/clients/f6e8d969-129f-42d2-854b-c2eca9d5a42e', {name: 'newname'})
        .reply(200, {
          id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
          name: 'newname',
          redirect_uri: 'https://myapp.com',
          secret: 'clientsecret',
        })

      const {stderr} = await runCommand(['clients:update', 'f6e8d969-129f-42d2-854b-c2eca9d5a42e', '--name', 'newname'])

      expect(stderr).to.contain('Updating f6e8d969-129f-42d2-854b-c2eca9d5a42e... done\n')
    })
  })

  context('with a url flag', function () {
    it('updates the client url', async function () {
      api
        .patch('/oauth/clients/f6e8d969-129f-42d2-854b-c2eca9d5a42e', {redirect_uri: 'https://heroku.com'})
        .reply(200, {
          id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
          name: 'newname',
          redirect_uri: 'https://heroku.com',
          secret: 'clientsecret',
        })

      const {stderr} = await runCommand(['clients:update', 'f6e8d969-129f-42d2-854b-c2eca9d5a42e', '--url', 'https://heroku.com'])

      expect(stderr).to.contain('Updating f6e8d969-129f-42d2-854b-c2eca9d5a42e... done\n')
    })
  })

  context('with no flags', function () {
    it('errors with no changes provided', async function () {
      const {error} = await runCommand(['clients:update', 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'])

      expect(error?.message).to.equal('No changes provided.')
    })
  })
})
