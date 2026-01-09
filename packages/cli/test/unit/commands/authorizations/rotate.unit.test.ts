import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('authorizations:rotate', function () {
  let api: nock.Scope
  const authorizationID = '4UTHOri24tIoN-iD-3X4mPl3'

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('rotates and prints the authentication', async function () {
    api
      .post(`/oauth/authorizations/${authorizationID}/actions/regenerate-tokens`)
      .reply(200, {access_token: {token: 'secrettoken'}, scope: ['global', 'app']})

    const {stderr, stdout} = await runCommand(['authorizations:rotate', authorizationID])

    expect(stdout).to.contain('Client:      <none>\n')
    expect(stdout).to.contain('Scope:       global,app\n')
    expect(stdout).to.contain('Token:       secrettoken\n')
    expect(stderr).to.contain('Rotating OAuth Authorization... done')
  })
})
