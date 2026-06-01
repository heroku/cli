import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {restore, stub} from 'sinon'

import Pipelines from '../../../../src/commands/pipelines/index.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

describe('pipelines', function () {
  let sdkMock: MockSDK

  afterEach(function () {
    sdkMock.restore()
    restore()
  })

  it('shows a list of pipelines', async function () {
    const listStub = stub().resolves([
      {id: '0123', name: 'Betelgeuse'},
      {id: '9876', name: 'Sirius'},
    ])
    sdkMock = mockSDKPlatform({pipeline: {list: listStub}})

    const {stderr, stdout} = await runCommand(Pipelines, [])

    expect(stderr).to.contain('')
    expect(stdout).to.contain('My Pipelines')
    expect(stdout).to.contain('Betelgeuse')
    expect(stdout).to.contain('Sirius')
  })

  it('shows a list of pipelines, json formatted', async function () {
    const pipelines = [
      {id: '0123', name: 'Betelgeuse'},
      {id: '9876', name: 'Sirius'},
    ]
    const listStub = stub().resolves(pipelines)
    sdkMock = mockSDKPlatform({pipeline: {list: listStub}})

    const {stderr, stdout} = await runCommand(Pipelines, ['--json'])

    expect(stderr).to.contain('')
    expect(JSON.parse(stdout)).to.eql(pipelines)
  })
})
