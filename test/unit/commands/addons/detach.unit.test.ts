import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {stub} from 'sinon'

import Cmd from '../../../../src/commands/addons/detach.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

describe('addons:detach', function () {
  let sdkMock: MockSDK

  afterEach(function () {
    sdkMock.restore()
  })

  it('detaches an add-on', async function () {
    const infoByAppStub = stub().resolves({addon: {name: 'redis'}, id: 100, name: 'redis-123'})
    const deleteStub = stub().resolves({id: 100, name: 'redis-123'})
    const listReleasesStub = stub().resolves([{version: 10}])
    const fakePlatform = {
      addOnAttachment: {delete: deleteStub, infoByApp: infoByAppStub},
      release: {list: listReleasesStub},
      withHeaders: stub().returns({release: {list: listReleasesStub}}),
    }
    sdkMock = mockSDKPlatform(fakePlatform)

    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'myapp', 'redis-123'])
    expect(stdout).to.equal('')
    expect(stderr).to.contain('Detaching redis-123 to redis from ⬢ myapp... done')
    expect(stderr).to.contain('Unsetting redis-123 config vars and restarting ⬢ myapp... done, v10')
    expect(infoByAppStub.calledOnceWith('myapp', 'redis-123')).to.be.true
    expect(deleteStub.calledOnceWith(100)).to.be.true
  })
})
