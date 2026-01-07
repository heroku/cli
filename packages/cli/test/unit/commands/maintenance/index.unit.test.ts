import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('maintenance', function () {
  afterEach(() => nock.cleanAll())

  it('shows that maintenance is on', async () => {
    nock('https://api.heroku.com:443')
      .get('/apps/myapp')
      .reply(200, {maintenance: true})

    const {stdout, stderr} = await runCommand(['maintenance', '-a', 'myapp'])

    expect(stdout).to.equal('on\n')
    expect(stderr).to.be.empty
  })

  it('shows that maintenance is off', async () => {
    nock('https://api.heroku.com:443')
      .get('/apps/myapp')
      .reply(200, {maintenance: false})

    const {stdout, stderr} = await runCommand(['maintenance', '-a', 'myapp'])

    expect(stdout).to.equal('off\n')
    expect(stderr).to.be.empty
  })
})
