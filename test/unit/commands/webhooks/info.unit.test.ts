import {expect} from 'chai'
import nock from 'nock'

import Info from '../../../../src/commands/webhooks/info.js'
import {runCommand} from '../../../helpers/run-command.js'

describe('webhooks:info', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('displays info for a given app webhook', async function () {
    api
      .get('/apps/example-app/webhooks/99999999-9999-9999-9999-999999999999')
      .reply(200, {
        id: '99999999-9999-9999-9999-999999999999',
        include: ['foo', 'bar'],
        level: 'notify',
        url: 'http://foobar.com',
      })

    const {stderr, stdout} = await runCommand(Info, ['--app', 'example-app', '99999999-9999-9999-9999-999999999999'])

    expect(stderr).to.equal('')
    expect(stdout).to.contain('=== 99999999-9999-9999-9999-999999999999')
    expect(stdout).to.contain('Include:    foo,bar')
    expect(stdout).to.contain('Level:      notify')
    expect(stdout).to.contain('URL:        http://foobar.com')
    expect(stdout).to.contain('Webhook ID: 99999999-9999-9999-9999-999999999999')
  })

  it('displays info for a given pipeline webhook', async function () {
    api
      .get('/pipelines/example-pipeline/webhooks/99999999-9999-9999-9999-999999999999')
      .reply(200, {
        id: '99999999-9999-9999-9999-999999999999',
        include: ['foo', 'bar'],
        level: 'notify',
        url: 'http://foobar.com',
      })

    const {stderr, stdout} = await runCommand(Info, ['--pipeline', 'example-pipeline', '99999999-9999-9999-9999-999999999999'])

    expect(stderr).to.equal('')
    expect(stdout).to.contain('=== 99999999-9999-9999-9999-999999999999')
    expect(stdout).to.contain('Include:    foo,bar')
    expect(stdout).to.contain('Level:      notify')
    expect(stdout).to.contain('URL:        http://foobar.com')
    expect(stdout).to.contain('Webhook ID: 99999999-9999-9999-9999-999999999999')
  })
})
