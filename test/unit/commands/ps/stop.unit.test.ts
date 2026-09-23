import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import {stub} from 'sinon'

import Cmd from '../../../../src/commands/ps/stop.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

describe('ps:stop', function () {
  let sdkMock: MockSDK

  afterEach(function () {
    sdkMock.restore()
  })

  it('requires a dyno name or type', async function () {
    sdkMock = mockSDKPlatform({dyno: {}})

    const {error} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expect(error!.message).to.include('Please specify a process type or dyno name to stop.')
  })

  it('stops all dynos of a process type', async function () {
    const stopFormationStub = stub().resolves()
    sdkMock = mockSDKPlatform({dyno: {stopFormation: stopFormationStub}})

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--process-type',
      'web',
    ])
    expectOutput(stderr, 'Stopping all web dynos on ⬢ myapp... done')
    expect(stopFormationStub.calledOnceWith('myapp', 'web')).to.be.true
  })

  it('stops a specific dyno', async function () {
    const stopStub = stub().resolves()
    sdkMock = mockSDKPlatform({dyno: {stop: stopStub}})

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--dyno-name',
      'web.1',
    ])
    expectOutput(stderr, 'Stopping dyno web.1 on ⬢ myapp... done')
    expect(stopStub.calledOnceWith('myapp', 'web.1')).to.be.true
  })

  it('emits a warning when passing dyno as an arg', async function () {
    const stopStub = stub().resolves()
    sdkMock = mockSDKPlatform({dyno: {stop: stopStub}})

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'web.1',
    ])
    expect(ansis.strip(stderr)).to.include('Warning: DYNO is a deprecated argument.')
    expect(stderr).to.include('Stopping dyno web.1 on ⬢ myapp... done')
    expect(stopStub.calledOnceWith('myapp', 'web.1')).to.be.true
  })
})
