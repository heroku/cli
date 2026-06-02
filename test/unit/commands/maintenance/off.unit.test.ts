import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Off from '../../../../src/commands/maintenance/off.js'

describe('maintenance:off', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('turns maintenance mode off', async function () {
    api
      .patch('/apps/myapp', {maintenance: false})
      .reply(200)

    const {stderr, stdout} = await runCommand(Off, ['-a', 'myapp'])

    expect(stdout).to.be.empty
    expect(stderr).to.contain('Disabling maintenance mode for ⬢ myapp... done')
  })
})
