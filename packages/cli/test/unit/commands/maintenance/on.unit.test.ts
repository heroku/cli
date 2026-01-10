import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('maintenance:on', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('turns maintenance mode on', async function () {
    api
      .patch('/apps/myapp', {maintenance: true})
      .reply(200)

    const {stderr, stdout} = await runCommand(['maintenance:on', '-a', 'myapp'])

    expect(stdout).to.be.empty
    expect(stderr).to.contain('Enabling maintenance mode for ⬢ myapp... done')
  })
})
