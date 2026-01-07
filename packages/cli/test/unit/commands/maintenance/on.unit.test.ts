import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('maintenance:on', function () {
  afterEach(() => nock.cleanAll())

  it('turns maintenance mode on', async () => {
    nock('https://api.heroku.com:443')
      .patch('/apps/myapp', {maintenance: true})
      .reply(200)

    const {stdout, stderr} = await runCommand(['maintenance:on', '-a', 'myapp'])

    expect(stdout).to.be.empty
    expect(stderr).to.contain('Enabling maintenance mode for ⬢ myapp... done')
  })
})
