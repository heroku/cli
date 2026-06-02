import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import On from '../../../../src/commands/maintenance/on.js'

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

    const {stderr, stdout} = await runCommand(On, ['-a', 'myapp'])

    expect(stdout).to.be.empty
    expect(stderr).to.contain('Enabling maintenance mode for ⬢ myapp... done')
  })
})
