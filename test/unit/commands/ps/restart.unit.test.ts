import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import {stub} from 'sinon'

import Cmd from '../../../../src/commands/ps/restart.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

describe('ps:restart', function () {
  let sdkMock: MockSDK

  afterEach(function () {
    sdkMock.restore()
  })

  it('restarts all dynos', async function () {
    const restartStub = stub().resolves()
    sdkMock = mockSDKPlatform({dyno: {restart: restartStub}})

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expectOutput(stderr, 'Restarting all dynos on ⬢ myapp... done')
    expect(restartStub.calledOnceWith('myapp')).to.be.true
  })

  it('restarts web dynos', async function () {
    const restartStub = stub().resolves()
    sdkMock = mockSDKPlatform({dyno: {restart: restartStub}})

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--process-type',
      'web',
    ])
    expectOutput(stderr, 'Restarting all web dynos on ⬢ myapp... done')
    expect(restartStub.calledOnceWith('myapp', {type: 'web'})).to.be.true
  })

  it('restarts a specific dyno', async function () {
    const restartStub = stub().resolves()
    sdkMock = mockSDKPlatform({dyno: {restart: restartStub}})

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--dyno-name',
      'web.1',
    ])
    expectOutput(stderr, 'Restarting dyno web.1 on ⬢ myapp... done')
    expect(restartStub.calledOnceWith('myapp', {dyno: 'web.1'})).to.be.true
  })

  it('emits a warning when passing dyno as an arg', async function () {
    const restartStub = stub().resolves()
    sdkMock = mockSDKPlatform({dyno: {restart: restartStub}})

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'web.1',
    ])
    expect(ansis.strip(stderr)).to.include('DYNO is a deprecated argument.')
    expect(stderr).to.include('Restarting dyno web.1 on ⬢ myapp... done')
    expect(restartStub.calledOnceWith('myapp', {dyno: 'web.1'})).to.be.true
  })
})
