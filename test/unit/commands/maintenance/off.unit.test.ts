import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {restore, stub} from 'sinon'

import Off from '../../../../src/commands/maintenance/off.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

describe('maintenance:off', function () {
  let sdkMock: MockSDK

  afterEach(function () {
    sdkMock.restore()
    restore()
  })

  it('turns maintenance mode off', async function () {
    const disableStub = stub().resolves()
    sdkMock = mockSDKPlatform({app: {disableMaintenance: disableStub}})

    const {stderr, stdout} = await runCommand(Off, ['-a', 'myapp'])

    expect(stdout).to.be.empty
    expect(stderr).to.contain('Disabling maintenance mode for ⬢ myapp... done')
    expect(disableStub.calledOnceWith('myapp')).to.be.true
  })
})
