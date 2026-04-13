import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import DomainsWait from '../../../../src/commands/domains/wait.js'

describe('domains:wait', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('waits on domain status succeeded', async function () {
    api
      .get('/apps/myapp/domains/example.com')
      .reply(200, {hostname: 'example.com', id: 123, status: 'pending'})
      .get('/apps/myapp/domains/123')
      .reply(200, {hostname: 'example.com', id: 123, status: 'succeeded'})

    const {stderr} = await runCommand(DomainsWait, ['example.com', '--app', 'myapp'])

    expect(stderr).to.contain('Waiting for example.com... done')
  })

  it('waits on domains when no hostname is provided', async function () {
    api
      .get('/apps/myapp/domains')
      .reply(200, [{hostname: 'example.com', id: 123, status: 'pending'}])
      .get('/apps/myapp/domains/123')
      .reply(200, {hostname: 'example.com', id: 123, status: 'succeeded'})

    const {stderr} = await runCommand(DomainsWait, ['--app', 'myapp'])

    expect(stderr).to.contain('Waiting for example.com... done')
  })
})
