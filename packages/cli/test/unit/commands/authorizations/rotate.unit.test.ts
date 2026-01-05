import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('authorizations:rotate', function () {
  const authorizationID = '4UTHOri24tIoN-iD-3X4mPl3'

  afterEach(() => nock.cleanAll())

  it('rotates and prints the authentication', async () => {
    nock('https://api.heroku.com:443')
      .post(`/oauth/authorizations/${authorizationID}/actions/regenerate-tokens`)
      .reply(200, {scope: ['global', 'app'], access_token: {token: 'secrettoken'}})

    const {stdout, stderr} = await runCommand(['authorizations:rotate', authorizationID])

    expect(stdout).to.contain('Client:      <none>\n')
    expect(stdout).to.contain('Scope:       global,app\n')
    expect(stdout).to.contain('Token:       secrettoken\n')
    expect(stderr).to.contain('Rotating OAuth Authorization... done')
  })
})
