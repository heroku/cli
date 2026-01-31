import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('authorizations:create', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('creates the authorization', async function () {
    api
      .post('/oauth/authorizations', {description: 'awesome'})
      .reply(201, {access_token: {token: 'secrettoken'}, scope: ['global']})

    const {stdout} = await runCommand(['authorizations:create', '--description', 'awesome'])

    expect(stdout).to.contain('Client:      <none>\n')
    expect(stdout).to.contain('Scope:       global\n')
    expect(stdout).to.contain('Token:       secrettoken\n')
  })

  context('with short flag', function () {
    it('only prints token', async function () {
      api
        .post('/oauth/authorizations', {expires_in: '10000'})
        .reply(201, {access_token: {token: 'secrettoken'}, scope: ['global']})

      const {stdout} = await runCommand(['authorizations:create', '--expires-in', '10000', '--short'])

      expect(stdout).to.equal('secrettoken\n')
    })
  })

  context('with json flag', function () {
    it('prints json', async function () {
      api
        .post('/oauth/authorizations', {})
        .reply(201, {access_token: {token: 'secrettoken'}, scope: ['global']})

      const {stdout} = await runCommand(['authorizations:create', '--json'])

      const json = JSON.parse(stdout)
      expect(json.access_token).to.contain({token: 'secrettoken'})
      expect(json.scope).to.contain('global')
    })
  })
})
