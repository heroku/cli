import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'

import Cmd from '../../../../src/commands/addons/docs.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

describe('addons:docs', function () {
  let sdkMock: MockSDK
  let urlOpenerStub: SinonStub
  let infoStub: SinonStub
  let resolveStub: SinonStub

  beforeEach(function () {
    urlOpenerStub = stub(Cmd, 'urlOpener').callsFake(async () => {})
    infoStub = stub()
    resolveStub = stub()
    sdkMock = mockSDKPlatform({
      addOn: {resolve: resolveStub},
      addOnService: {info: infoStub},
    })
  })

  afterEach(function () {
    urlOpenerStub.reset()
    urlOpenerStub.restore()
    sdkMock.restore()
  })

  it('opens an addon by name', async function () {
    infoStub.resolves({name: 'slowdb'})

    const {stderr, stdout} = await runCommand(Cmd, ['--show-url', 'slowdb'])
    expect(stdout).to.equal('https://devcenter.heroku.com/articles/slowdb\n')
    expect(stderr).to.equal('')
  })

  it('opens an addon by name with no url flag passed', async function () {
    infoStub.resolves({name: 'slowdb'})

    const {stdout} = await runCommand(Cmd, ['slowdb'])
    expect(stdout).to.equal('Opening https://devcenter.heroku.com/articles/slowdb...\n')
    expect(urlOpenerStub.calledWith('https://devcenter.heroku.com/articles/slowdb')).to.be.true
  })

  it('opens an addon by attachment name', async function () {
    infoStub.rejects(new Error('not found'))
    resolveStub.resolves({addon_service: {name: 'slowdb'}})

    const {stderr, stdout} = await runCommand(Cmd, ['--show-url', 'my-attachment-1111'])
    expect(stdout).to.equal('https://devcenter.heroku.com/articles/slowdb\n')
    expect(stderr).to.equal('')
    expect(resolveStub.calledWith('my-attachment-1111', {appIdentity: undefined})).to.be.true
  })

  it('opens an addon by app/attachment name', async function () {
    infoStub.rejects(new Error('not found'))
    resolveStub.resolves({addon_service: {name: 'slowdb'}})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--show-url',
      'my-attachment-1111',
    ])
    expect(stdout).to.equal('https://devcenter.heroku.com/articles/slowdb\n')
    expect(stderr).to.equal('')
    expect(resolveStub.calledWith('my-attachment-1111', {appIdentity: 'myapp'})).to.be.true
  })
})
