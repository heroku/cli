import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'
import stripAnsi from 'strip-ansi'

describe('keys:remove', function () {
  afterEach(() => nock.cleanAll())

  it('removes an SSH key', async () => {
    nock('https://api.heroku.com:443')
      .get('/account/keys')
      .reply(200, [{id: 1, comment: 'user@machine'}])
      .delete('/account/keys/1')
      .reply(200)

    const {stdout, stderr} = await runCommand(['keys:remove', 'user@machine'])

    expect(stdout).to.equal('')
    expect(stderr).to.contain('Removing user@machine SSH key... done\n')
  })

  it('errors if no SSH keys on account', async () => {
    nock('https://api.heroku.com:443')
      .get('/account/keys')
      .reply(200, [])

    const {error} = await runCommand(['keys:remove', 'user@machine'])

    expect(error?.message).to.equal('No SSH keys on account')
  })

  it('errors with incorrect SSH key on account', async () => {
    nock('https://api.heroku.com:443')
      .get('/account/keys')
      .reply(200, [{id: 1, comment: 'user@machine'}])

    const {error} = await runCommand(['keys:remove', 'different@machine'])

    expect(error).to.exist
    expect(stripAnsi(error!.message)).to.equal('SSH Key different@machine not found.\nFound keys: user@machine.')
  })
})
