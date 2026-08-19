import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {stub} from 'sinon'

import Cmd from '../../../../src/commands/spaces/rename.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

describe('spaces:rename', function () {
  let updateStub: ReturnType<typeof stub>
  let sdkMock: MockSDK

  beforeEach(function () {
    updateStub = stub()
    sdkMock = mockSDKPlatform({space: {update: updateStub}})
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('renames a space', async function () {
    updateStub.resolves(undefined)

    const {stderr} = await runCommand(Cmd, [
      '--from',
      'old-space-name',
      '--to',
      'new-space-name',
    ])
    expect(updateStub.calledOnceWith('old-space-name', {name: 'new-space-name'})).to.equal(true)
    expectOutput(stderr, 'Renaming space from ⬡ old-space-name to new-space-name... done')
  })
})
