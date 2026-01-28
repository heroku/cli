import {runCommand} from '@oclif/test'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'

describe('keys:remove', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('removes an SSH key', async function () {
    api
      .get('/account/keys')
      .reply(200, [{comment: 'user@machine', id: 1}])
      .delete('/account/keys/1')
      .reply(200)

    const {stderr, stdout} = await runCommand(['keys:remove', 'user@machine'])

    expect(stdout).to.equal('')
    expect(stderr).to.contain('Removing user@machine SSH key... done\n')
  })

  it('errors if no SSH keys on account', async function () {
    api
      .get('/account/keys')
      .reply(200, [])

    const {error} = await runCommand(['keys:remove', 'user@machine'])

    expect(error?.message).to.equal('No SSH keys on account')
  })

  it('errors with incorrect SSH key on account', async function () {
    api
      .get('/account/keys')
      .reply(200, [{comment: 'user@machine', id: 1}])

    const {error} = await runCommand(['keys:remove', 'different@machine'])

    expect(error).to.exist
    expect(ansis.strip(error!.message)).to.equal('SSH Key different@machine not found.\nFound keys: user@machine.')
  })
})
