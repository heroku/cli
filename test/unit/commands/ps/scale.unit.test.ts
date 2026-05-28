import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import {stub} from 'sinon'

import Cmd from '../../../../src/commands/ps/scale.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

describe('ps:scale', function () {
  let sdkMock: MockSDK

  afterEach(function () {
    sdkMock.restore()
  })

  it('shows formation with no args', async function () {
    const listStub = stub().resolves([{quantity: 1, size: 'Free', type: 'web'}, {quantity: 2, size: 'Free', type: 'worker'}])
    const infoStub = stub().resolves({name: 'myapp'})
    sdkMock = mockSDKPlatform({app: {info: infoStub}, formation: {list: listStub}})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(stdout).to.equal('web=1:Free worker=2:Free\n')
    expect(stderr).to.equal('')
    expect(listStub.calledOnceWith('myapp')).to.be.true
  })

  it('shows formation with shield dynos for apps in a shielded private space', async function () {
    const listStub = stub().resolves([{quantity: 1, size: 'Private-L', type: 'web'}, {quantity: 2, size: 'Private-M', type: 'worker'}])
    const infoStub = stub().resolves({name: 'myapp', space: {shield: true}})
    sdkMock = mockSDKPlatform({app: {info: infoStub}, formation: {list: listStub}})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(stdout).to.equal('web=1:Shield-L worker=2:Shield-M\n')
    expect(stderr).to.equal('')
  })

  it('errors with no process types', async function () {
    const listStub = stub().resolves([])
    const infoStub = stub().resolves({name: 'myapp'})
    sdkMock = mockSDKPlatform({app: {info: infoStub}, formation: {list: listStub}})

    const {error, stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expect(ansis.strip(error!.message)).to.include('No process types on ⬢ myapp.')

    expect(stdout).to.equal('')
    expect(stderr).to.equal('')
  })

  it('scales web=1 worker=2', async function () {
    const batchUpdateStub = stub().resolves([{quantity: 1, size: 'Free', type: 'web'}, {quantity: 2, size: 'Free', type: 'worker'}])
    const infoStub = stub().resolves({name: 'myapp'})
    sdkMock = mockSDKPlatform({app: {info: infoStub}, formation: {batchUpdate: batchUpdateStub}})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'web=1',
      'worker=2',
    ])

    expect(stdout).to.equal('')
    expect(stderr).to.contain('Scaling dynos... done, now running web at 1:Free, worker at 2:Free\n')
    expect(batchUpdateStub.calledOnceWith('myapp', {updates: [{quantity: '1', size: undefined, type: 'web'}, {quantity: '2', size: undefined, type: 'worker'}]})).to.be.true
  })

  it('scales up a shield dyno if the app is in a shielded private space', async function () {
    const batchUpdateStub = stub().resolves([{quantity: 1, size: 'Private-L', type: 'web'}])
    const infoStub = stub().resolves({name: 'myapp', space: {shield: true}})
    sdkMock = mockSDKPlatform({app: {info: infoStub}, formation: {batchUpdate: batchUpdateStub}})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'web=1:Shield-L',
    ])

    expect(stdout).to.equal('')
    expect(stderr).to.contain('Scaling dynos... done, now running web at 1:Shield-L\n')
    expect(batchUpdateStub.calledOnceWith('myapp', {updates: [{quantity: '1', size: 'Private-L', type: 'web'}]})).to.be.true
  })

  it('scales web-1', async function () {
    const batchUpdateStub = stub().resolves([{quantity: 2, size: 'Free', type: 'web'}])
    const infoStub = stub().resolves({name: 'myapp'})
    sdkMock = mockSDKPlatform({app: {info: infoStub}, formation: {batchUpdate: batchUpdateStub}})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'web+1',
    ])

    expect(stdout).to.equal('')
    expect(stderr).to.contain('Scaling dynos... done, now running web at 2:Free\n')
    expect(batchUpdateStub.calledOnceWith('myapp', {updates: [{quantity: '+1', size: undefined, type: 'web'}]})).to.be.true
  })
})
