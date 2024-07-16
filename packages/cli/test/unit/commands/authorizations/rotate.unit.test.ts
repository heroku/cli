import {expect, test} from '@oclif/test'

describe('authorizations:rotate', function () {
  const authorizationID = '4UTHOri24tIoN-iD-3X4mPl3'

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => {
      api
        .post(`/oauth/authorizations/${authorizationID}/actions/regenerate-tokens`)
        .reply(200, {scope: ['global', 'app'], access_token: {token: 'secrettoken'}})
    })
    .command(['authorizations:rotate', authorizationID])
    .it('rotates and prints the authentication', ctx => {
      expect(ctx.stdout).to.contain('Client:      <none>\n')
      expect(ctx.stdout).to.contain('Scope:       global,app\n')
      expect(ctx.stdout).to.contain('Token:       secrettoken\n')
      expect(ctx.stderr).to.contain('Rotating OAuth Authorization... done')
    })
})
