import {runCommand} from '@oclif/test'
import {expect} from 'chai'

/*
describe('authorizations:revoke', function () {
  const authorizationID = '4UTHOri24tIoN-iD-3X4mPl3'

  test
    .stderr()
    .nock('https://api.heroku.com:443', api => {
      api.delete(`/oauth/authorizations/${authorizationID}`).reply(200, {description: 'Example Auth'})
    })
    .command(['authorizations:revoke', authorizationID])
    .it('revokes the authorization', ctx => {
      expect(ctx.stderr).to.contain(
        'done, revoked authorization from Example Auth\n',
      )
    })

  context('without an ID argument', function () {
    test
      .command(['authorizations:revoke'])
      .catch(error => expect(error.message).to.equal(
        'Missing 1 required arg:\nid  ID of the authorization\nSee more help with --help',
      ))
      .it('shows required ID error')
  })
})

*/
