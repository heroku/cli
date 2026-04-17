import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {restore, SinonStub, stub} from 'sinon'

import Cmd from '../../../../src/commands/addons/attach.js'
import ConfirmCommand from '../../../../src/lib/confirm-command.js'

let confirmStub: SinonStub

describe('addons:attach', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    confirmStub = stub(ConfirmCommand.prototype, 'confirm').resolves()
  })

  afterEach(function () {
    confirmStub.restore()
    api.done()
    nock.cleanAll()
    restore()
  })

  it('attaches an add-on', async function () {
    api
      .get('/addons/redis-123')
      .reply(200, {name: 'redis-123'})
      .post('/addon-attachments', {addon: {name: 'redis-123'}, app: {name: 'myapp'}})
      .reply(201, {name: 'REDIS'})
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}])

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'redis-123',
    ])
    expect(stdout).to.equal('')
    expect(stderr).to.contain('Attaching ⛁ redis-123 to ⬢ myapp... done')
    expect(stderr).to.contain('\nSetting REDIS config vars and restarting ⬢ myapp... done, v10')
  })

  it('attaches an add-on as foo', async function () {
    api
      .get('/addons/redis-123')
      .reply(200, {name: 'redis-123'})
      .post('/addon-attachments', {addon: {name: 'redis-123'}, app: {name: 'myapp'}, name: 'foo'})
      .reply(201, {name: 'foo'})
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}])

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--as',
      'foo',
      'redis-123',
    ])
    expect(stdout).to.equal('')
    expect(stderr).to.contain('Attaching ⛁ redis-123 as foo to ⬢ myapp... done')
    expect(stderr).to.contain('\nSetting foo config vars and restarting ⬢ myapp... done, v10')
  })

  it('overwrites an add-on as foo when confirmation is set', async function () {
    api
      .get('/addons/redis-123')
      .reply(200, {name: 'redis-123'})
      .post('/addon-attachments', {addon: {name: 'redis-123'}, app: {name: 'myapp'}, name: 'foo'})
      .reply(400, {id: 'confirmation_required'})
      .post('/addon-attachments', {
        addon: {name: 'redis-123'}, app: {name: 'myapp'}, confirm: 'myapp', name: 'foo',
      })
      .reply(201, {name: 'foo'})
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}])

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--as',
      'foo',
      'redis-123',
    ])
    expect(stdout).to.equal('')
    expect(stderr).to.contain('Attaching ⛁ redis-123 as foo to ⬢ myapp...')
    expect(stderr).to.contain('Attaching ⛁ redis-123 as foo to ⬢ myapp... done')
    expect(stderr).to.contain('Setting foo config vars and restarting ⬢ myapp... done, v10')
  })

  it('attaches an addon without a namespace if the credential flag is set to default', async function () {
    api
      .get('/addons/postgres-123')
      .reply(200, {name: 'postgres-123'})
      .post('/addon-attachments', {addon: {name: 'postgres-123'}, app: {name: 'myapp'}})
      .reply(201, {name: 'POSTGRES_HELLO'})
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}])

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--credential',
      'default',
      'postgres-123',
    ])
    expect(stdout).to.equal('')
    expect(stderr).to.contain('Attaching default of ⛁ postgres-123 to ⬢ myapp... done')
    expect(stderr).to.contain('Setting POSTGRES_HELLO config vars and restarting ⬢ myapp... done, v10')
  })

  it('attaches in the credential namespace if the credential flag is specified', async function () {
    api
      .get('/addons/postgres-123')
      .reply(200, {name: 'postgres-123'})
      .get('/addons/postgres-123/config/credential:hello')
      .reply(200, [{some: 'config'}])
      .post('/addon-attachments', {addon: {name: 'postgres-123'}, app: {name: 'myapp'}, namespace: 'credential:hello'})
      .reply(201, {name: 'POSTGRES_HELLO'})
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}])

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--credential',
      'hello',
      'postgres-123',
    ])
    expect(stdout).to.equal('')
    expect(stderr).to.contain('Attaching hello of ⛁ postgres-123 to ⬢ myapp... done')
    expect(stderr).to.contain('Setting POSTGRES_HELLO config vars and restarting ⬢ myapp... done, v10')
  })

  it('errors if the credential flag is specified but that credential does not exist for that addon', async function () {
    api
      .get('/addons/postgres-123')
      .reply(200, {name: 'postgres-123'})
      .get('/addons/postgres-123/config/credential:hello')
      .reply(200, [])

    const {error} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--credential',
      'hello',
      'postgres-123',
    ])
    expect(ansis.strip(error?.message || '')).to.equal('Could not find credential hello for database ⛁ postgres-123')
  })
})
