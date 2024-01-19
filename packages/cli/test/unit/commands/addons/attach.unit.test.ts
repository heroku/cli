import {stdout, stderr} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/addons/attach'
import runCommand from '../../../helpers/runCommand'
import {expect} from 'chai'
import * as nock from 'nock'
import * as confirmApp from '../../../../src/lib/apps/confirm-app'
import * as sinon from 'sinon'

let confirmStub: ReturnType<typeof sinon.stub>

describe('addons:attach', function () {
  beforeEach(() => {
    confirmStub = sinon.stub(confirmApp, 'default').returns(Promise.resolve())
  })
  afterEach(() => {
    confirmStub.restore()
    nock.cleanAll()
  })

  it('attaches an add-on', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/addons/redis-123')
      .reply(200, {name: 'redis-123'})
      .post('/addon-attachments', {app: {name: 'myapp'}, addon: {name: 'redis-123'}})
      .reply(201, {name: 'REDIS'})
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}])

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'redis-123',
    ])
    expect(stdout.output, 'to be empty')
    expect(stderr.output).to.contain('Attaching redis-123 to myapp... done\n')
    expect(stderr.output).to.contain('\nSetting REDIS config vars and restarting myapp... done, v10\n')
    return api.done()
  })
  it('attaches an add-on as foo', function () {
    const api = nock('https://api.heroku.com:443')
      .get('/addons/redis-123')
      .reply(200, {name: 'redis-123'})
      .post('/addon-attachments', {name: 'foo', app: {name: 'myapp'}, addon: {name: 'redis-123'}})
      .reply(201, {name: 'foo'})
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}])

    return runCommand(Cmd, [
      '--app',
      'myapp',
      'redis-123',
    ])
      .then(() => expect(stdout.output, 'to be empty'))
      .then(() => expect(stderr.output).to.equal('Attaching redis-123 as foo to myapp... done\nSetting foo config vars and restarting myapp... done, v10\n'))
      .then(() => api.done())
  })

  it('overwrites an add-on as foo when confirmation is set', function () {
    const api = nock('https://api.heroku.com:443')
      .get('/addons/redis-123')
      .reply(200, {name: 'redis-123'})
      .post('/addon-attachments', {name: 'foo', app: {name: 'myapp'}, addon: {name: 'redis-123'}})
      .reply(400, {id: 'confirmation_required'})
      .post('/addon-attachments', {name: 'foo', app: {name: 'myapp'}, addon: {name: 'redis-123'}, confirm: 'myapp'})
      .reply(201, {name: 'foo'})
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}])

    return runCommand(Cmd, [
      '--app',
      'myapp',
      'redis-123',
    ])
      .then(() => expect(stdout.output, 'to be empty'))
      .then(() => expect(stderr.output).to.equal('Attaching redis-123 as foo to myapp... !\nAttaching redis-123 as foo to myapp... done\nSetting foo config vars and restarting myapp... done, v10\n'))
      .then(() => api.done())
  })
  it('attaches an addon without a namespace if the credential flag is set to default', function () {
    const api = nock('https://api.heroku.com:443')
      .get('/addons/postgres-123')
      .reply(200, {name: 'postgres-123'})
      .post('/addon-attachments', {app: {name: 'myapp'}, addon: {name: 'postgres-123'}})
      .reply(201, {name: 'POSTGRES_HELLO'})
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}])

    return runCommand(Cmd, [
      '--app',
      'myapp',
      'postgres-123',
    ])
      .then(() => expect(stdout.output, 'to be empty'))
      .then(() => expect(stderr.output).to.equal('Attaching default of postgres-123 to myapp... done\nSetting POSTGRES_HELLO config vars and restarting myapp... done, v10\n'))
      .then(() => api.done())
  })
  it('attaches in the credential namespace if the credential flag is specified', function () {
    const api = nock('https://api.heroku.com:443')
      .get('/addons/postgres-123')
      .reply(200, {name: 'postgres-123'})
      .get('/addons/postgres-123/config/credential:hello')
      .reply(200, [{some: 'config'}])
      .post('/addon-attachments', {app: {name: 'myapp'}, addon: {name: 'postgres-123'}, namespace: 'credential:hello'})
      .reply(201, {name: 'POSTGRES_HELLO'})
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}])

    return runCommand(Cmd, [
      '--app',
      'myapp',
      'postgres-123',
    ])
      .then(() => expect(stdout.output, 'to be empty'))
      .then(() => expect(stderr.output).to.equal('Attaching hello of postgres-123 to myapp... done\nSetting POSTGRES_HELLO config vars and restarting myapp... done, v10\n'))
      .then(() => api.done())
  })
  it('errors if the credential flag is specified but that credential does not exist for that addon', function () {
    nock('https://api.heroku.com:443')
      .get('/addons/postgres-123')
      .reply(200, {name: 'postgres-123'})
      .get('/addons/postgres-123/config/credential:hello')
      .reply(200, [])

    return runCommand(Cmd, [
      '--app',
      'myapp',
      'postgres-123',
    ])
      .then(() => {
        throw new Error('unreachable')
      })
      .catch(error => expect(error.message).to.equal('Could not find credential hello for database postgres-123'))
  })
})
