import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('keys:clear', function () {
  afterEach(() => nock.cleanAll())

  it('removes all SSH keys', async () => {
    nock('https://api.heroku.com:443')
      .get('/account/keys')
      .reply(200, [{id: 1}, {id: 2}])
      .delete('/account/keys/1')
      .reply(200)
      .delete('/account/keys/2')
      .reply(200)

    const {stdout, stderr} = await runCommand(['keys:clear'])

    expect('').to.equal(stdout)
    expect(stderr).to.contain('Removing all SSH keys... done\n')
  })
})
