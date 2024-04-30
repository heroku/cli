import {expect, test} from '@oclif/test'
import stripAnsi = require('strip-ansi')

describe('keys:remove', function () {
  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .get('/account/keys')
        .reply(200, [{id: 1, comment: 'user@machine'}])
        .delete('/account/keys/1')
        .reply(200)
    })
    .command(['keys:remove', 'user@machine'])
    .it('removes an SSH key', ({stdout, stderr}) => {
      expect(stdout).to.equal('')
      expect(stderr).to.contain('Removing user@machine SSH key... done\n')
    })

  test
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .get('/account/keys')
        .reply(200, [])
    })
    .command(['keys:remove', 'user@machine'])
    .catch((error: any) => {
      expect(error).to.be.an.instanceof(Error)
      expect(error.message).to.equal('No SSH keys on account')
    })
    .it('errors if no SSH keys on account', ({stdout}) => {
      expect(stdout).to.equal('')
    })

  test
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .get('/account/keys')
        .reply(200, [{id: 1, comment: 'user@machine'}])
    })
    .command(['keys:remove', 'different@machine'])
    .catch((error: any) => {
      expect(error).to.be.an.instanceof(Error)
      expect(stripAnsi(error.message)).to.equal('SSH Key different@machine not found.\nFound keys: user@machine.')
    })
    .it('errors with incorrect SSH key on account', ({stdout}) => {
      expect(stdout).to.equal('')
    })
})
