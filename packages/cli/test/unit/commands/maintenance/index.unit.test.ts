import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('maintenance', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('shows that maintenance is on', async function () {
    api
      .get('/apps/myapp')
      .reply(200, {maintenance: true})

    const {stderr, stdout} = await runCommand(['maintenance', '-a', 'myapp'])

    expect(stdout).to.equal('on\n')
    expect(stderr).to.be.empty
  })

  it('shows that maintenance is off', async function () {
    api
      .get('/apps/myapp')
      .reply(200, {maintenance: false})

    const {stderr, stdout} = await runCommand(['maintenance', '-a', 'myapp'])

    expect(stdout).to.equal('off\n')
    expect(stderr).to.be.empty
  })
})
