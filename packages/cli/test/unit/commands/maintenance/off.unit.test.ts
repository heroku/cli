import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('maintenance:off', function () {
  afterEach(() => nock.cleanAll())

  it('turns maintenance mode off', async () => {
    nock('https://api.heroku.com:443')
      .patch('/apps/myapp', {maintenance: false})
      .reply(200)

    const {stdout, stderr} = await runCommand(['maintenance:off', '-a', 'myapp'])

    expect(stdout).to.be.empty
    expect(stderr).to.contain('Disabling maintenance mode for ⬢ myapp... done')
  })
})
