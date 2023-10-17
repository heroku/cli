import {expect, test} from '@oclif/test'

describe('apps', () => {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => {
      api.get('/account')
        .reply(200, {email: 'foo@bar.com'})

      api.get('/users/~/apps')
        .reply(200, [])
    })
    .command(['apps'])
    .it('displays a message when the user has no apps', ({stdout, stderr}) => {
      expect(stderr).to.equal('')
      expect(stdout).to.equal('You have no apps.\n')
    })
})
