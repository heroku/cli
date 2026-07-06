import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {restore, stub} from 'sinon'

import Maintenance from '../../../../src/commands/maintenance/index.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

describe('maintenance', function () {
  let sdkMock: MockSDK

  afterEach(function () {
    sdkMock.restore()
    restore()
  })

  it('shows that maintenance is on', async function () {
    sdkMock = mockSDKPlatform({app: {info: stub().resolves({maintenance: true})}})

    const {stderr, stdout} = await runCommand(Maintenance, ['-a', 'myapp'])

    expect(stdout).to.equal('on\n')
    expect(stderr).to.be.empty
  })

  it('shows that maintenance is off', async function () {
    sdkMock = mockSDKPlatform({app: {info: stub().resolves({maintenance: false})}})

    const {stderr, stdout} = await runCommand(Maintenance, ['-a', 'myapp'])

    expect(stdout).to.equal('off\n')
    expect(stderr).to.be.empty
  })
})
