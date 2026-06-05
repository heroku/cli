import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {restore, stub} from 'sinon'

import On from '../../../../src/commands/maintenance/on.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

describe('maintenance:on', function () {
  let sdkMock: MockSDK

  afterEach(function () {
    sdkMock.restore()
    restore()
  })

  it('turns maintenance mode on', async function () {
    const enableStub = stub().resolves()
    sdkMock = mockSDKPlatform({app: {enableMaintenance: enableStub}})

    const {stderr, stdout} = await runCommand(On, ['-a', 'myapp'])

    expect(stdout).to.be.empty
    expect(stderr).to.contain('Enabling maintenance mode for ⬢ myapp... done')
    expect(enableStub.calledOnceWith('myapp')).to.be.true
  })
})
