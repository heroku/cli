import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import DomainsClear from '../../../../src/commands/domains/clear.js'

describe('domains:clear', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  it('clears domains all domains', async function () {
    api
      .get('/apps/myapp/domains')
      .reply(200, [{hostname: 'example.com', kind: 'custom'}])
      .delete('/apps/myapp/domains/example.com')
      .reply(200, {})

    const {stderr} = await runCommand(DomainsClear, ['--app', 'myapp'])

    expect(stderr).to.contain('Removing all domains from ⬢ myapp... done')
  })
})
