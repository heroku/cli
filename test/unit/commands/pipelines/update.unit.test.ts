import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {restore, stub} from 'sinon'

import PipelinesUpdate from '../../../../src/commands/pipelines/update.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

describe('pipelines:update', function () {
  const app = 'example'
  const id = '0123'
  const stage = 'production'
  const coupling = {id, stage}
  let sdkMock: MockSDK

  afterEach(function () {
    sdkMock.restore()
    restore()
  })

  it('displays the right messages', async function () {
    const infoByAppStub = stub().resolves(coupling)
    const updateStub = stub().resolves(coupling)
    sdkMock = mockSDKPlatform({pipelineCoupling: {infoByApp: infoByAppStub, update: updateStub}})

    const {stderr} = await runCommand(PipelinesUpdate, [`--app=${app}`, `--stage=${stage}`])

    expect(stderr).to.include(`Changing ⬢ ${app} to ${stage}... done`)
    expect(infoByAppStub.calledOnceWith(app)).to.be.true
    expect(updateStub.calledOnceWith(id, {stage})).to.be.true
  })
})
