import {runCommand} from '@heroku-cli/test-utils'
import {HerokuApiClient} from '@heroku/heroku-fetch'
import ansis from 'ansis'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import Cmd from '../../../../src/commands/addons/attach.js'
import ConfirmCommand from '../../../../src/lib/confirm-command.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

let confirmStub: SinonStub

describe('addons:attach', function () {
  let sdkMock: MockSDK

  beforeEach(function () {
    confirmStub = stub(ConfirmCommand.prototype, 'confirm').resolves()
  })

  afterEach(function () {
    confirmStub.restore()
    sdkMock.restore()
    restore()
  })

  it('attaches an add-on', async function () {
    const infoStub = stub().resolves({name: 'redis-123'})
    const createStub = stub().resolves({name: 'REDIS'})
    const listReleasesStub = stub().resolves([{version: 10}])
    const fakePlatform = {
      addOn: {info: infoStub},
      addOnAttachment: {create: createStub},
      withHeaders: stub().returns({release: {list: listReleasesStub}}),
    }
    sdkMock = mockSDKPlatform(fakePlatform)

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'redis-123',
    ])
    expect(stdout).to.equal('')
    expect(stderr).to.contain('Attaching ⛁ redis-123 to ⬢ myapp... done')
    expect(stderr).to.contain('\nSetting REDIS config vars and restarting ⬢ myapp... done, v10')
    expect(infoStub.calledOnceWith('redis-123')).to.be.true
    expect(createStub.calledOnceWith({
      addon: 'redis-123', app: 'myapp', confirm: undefined, name: undefined, namespace: undefined,
    })).to.be.true
  })

  it('attaches an add-on as foo', async function () {
    const infoStub = stub().resolves({name: 'redis-123'})
    const createStub = stub().resolves({name: 'foo'})
    const listReleasesStub = stub().resolves([{version: 10}])
    const fakePlatform = {
      addOn: {info: infoStub},
      addOnAttachment: {create: createStub},
      withHeaders: stub().returns({release: {list: listReleasesStub}}),
    }
    sdkMock = mockSDKPlatform(fakePlatform)

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
    expect(createStub.calledOnceWith({
      addon: 'redis-123', app: 'myapp', confirm: undefined, name: 'foo', namespace: undefined,
    })).to.be.true
  })

  it('overwrites an add-on as foo when confirmation is set', async function () {
    const infoStub = stub().resolves({name: 'redis-123'})
    const listReleasesStub = stub().resolves([{version: 10}])
    // first call throws confirmation_required, second (confirmed) succeeds
    const confirmationError = Object.assign(new Error('confirmation required'), {body: {id: 'confirmation_required'}})
    const createStub = stub()
    createStub.onFirstCall().rejects(confirmationError)
    createStub.onSecondCall().resolves({name: 'foo'})
    const fakePlatform = {
      addOn: {info: infoStub},
      addOnAttachment: {create: createStub},
      withHeaders: stub().returns({release: {list: listReleasesStub}}),
    }
    sdkMock = mockSDKPlatform(fakePlatform)

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
    const infoStub = stub().resolves({name: 'postgres-123'})
    const createStub = stub().resolves({name: 'POSTGRES_HELLO'})
    const listReleasesStub = stub().resolves([{version: 10}])
    const fakePlatform = {
      addOn: {info: infoStub},
      addOnAttachment: {create: createStub},
      withHeaders: stub().returns({release: {list: listReleasesStub}}),
    }
    sdkMock = mockSDKPlatform(fakePlatform)

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
    // credential 'default' does not hit the escape-hatch config route and uses no namespace
    expect(createStub.calledOnceWith({
      addon: 'postgres-123', app: 'myapp', confirm: undefined, name: undefined, namespace: undefined,
    })).to.be.true
  })

  it('attaches in the credential namespace if the credential flag is specified', async function () {
    const infoStub = stub().resolves({name: 'postgres-123'})
    const createStub = stub().resolves({name: 'POSTGRES_HELLO'})
    const listReleasesStub = stub().resolves([{version: 10}])
    const fakePlatform = {
      addOn: {info: infoStub},
      addOnAttachment: {create: createStub},
      withHeaders: stub().returns({release: {list: listReleasesStub}}),
    }
    sdkMock = mockSDKPlatform(fakePlatform)
    const getStub: SinonStub = stub(HerokuApiClient.prototype, 'get')
    getStub.resolves({json: async () => [{some: 'config'}]})

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
    expect(getStub.calledOnceWith('/addons/postgres-123/config/credential:hello')).to.be.true
    expect(createStub.calledOnceWith({
      addon: 'postgres-123', app: 'myapp', confirm: undefined, name: undefined, namespace: 'credential:hello',
    })).to.be.true
  })

  it('errors if the credential flag is specified but that credential does not exist for that addon', async function () {
    const infoStub = stub().resolves({name: 'postgres-123'})
    const createStub = stub().resolves({name: 'POSTGRES_HELLO'})
    const listReleasesStub = stub().resolves([{version: 10}])
    const fakePlatform = {
      addOn: {info: infoStub},
      addOnAttachment: {create: createStub},
      withHeaders: stub().returns({release: {list: listReleasesStub}}),
    }
    sdkMock = mockSDKPlatform(fakePlatform)
    const getStub: SinonStub = stub(HerokuApiClient.prototype, 'get')
    getStub.resolves({json: async () => []})

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
