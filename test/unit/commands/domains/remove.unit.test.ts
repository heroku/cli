import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import DomainsRemove from '../../../../src/commands/domains/remove.js'

describe('domains:remove', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('removes a single domain provided by an argument', async function () {
    api
      .delete('/apps/myapp/domains/example.com')
      .reply(200, {})

    const {stderr} = await runCommand(DomainsRemove, ['example.com', '--app', 'myapp'])

    expect(stderr).to.contain('Removing example.com from ⬢ myapp... done')
  })
})
