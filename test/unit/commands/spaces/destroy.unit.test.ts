import {runCommand} from '@heroku-cli/test-utils'
import {hux} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../src/commands/spaces/destroy.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

describe('spaces:destroy', function () {
  const now = new Date()
  let infoStub: sinon.SinonStub
  let natInfoStub: sinon.SinonStub
  let deleteStub: sinon.SinonStub
  let sdkMock: MockSDK

  beforeEach(function () {
    sinon.stub(hux, 'prompt').resolves('my-space')
    infoStub = sinon.stub()
    natInfoStub = sinon.stub()
    deleteStub = sinon.stub()
    sdkMock = mockSDKPlatform({
      space: {delete: deleteStub, info: infoStub},
      spaceNat: {info: natInfoStub},
    })
  })

  afterEach(function () {
    sdkMock.restore()
    sinon.restore()
  })

  it('shows extended NAT warning for fir generation space', async function () {
    infoStub.resolves({
      created_at: now,
      generation: 'fir',
      name: 'my-space',
      region: {name: 'my-region'},
      state: 'allocated',
      team: {name: 'my-team'},
    })
    natInfoStub.resolves({sources: ['1.1.1.1', '2.2.2.2'], state: 'enabled'})
    deleteStub.resolves(undefined)

    const {stderr} = await runCommand(Cmd, ['--space', 'my-space'])
    const replacer = /([»›])/g
    const actual = removeAllWhitespace(stderr.replaceAll(replacer, ''))
    expect(actual).to.include(removeAllWhitespace('Warning: Destructive Action'))
    expect(actual).to.include(removeAllWhitespace('This command will destroy the space ⬡ my-space'))
    expect(actual).to.include(removeAllWhitespace('=== WARNING: Outbound IPs Will Be Reused'))
    expect(actual).to.include(removeAllWhitespace('⚠️ Deleting this space frees up the following outbound IPv4 and IPv6 IPs for reuse:'))
    expect(actual).to.include(removeAllWhitespace('1.1.1.1, 2.2.2.2'))
    expect(actual).to.include(removeAllWhitespace('Update the following configurations:'))
    expect(actual).to.include(removeAllWhitespace('= IP allowlists'))
    expect(actual).to.include(removeAllWhitespace('= Firewall rules'))
    expect(actual).to.include(removeAllWhitespace('= Security group configurations'))
    expect(actual).to.include(removeAllWhitespace('= Network ACLs'))
    expect(actual).to.include(removeAllWhitespace('Ensure that you remove the listed IPv4 and IPv6 addresses from your security configurations.'))
    expect(actual).to.include(removeAllWhitespace('Destroying space ⬡ my-space... done'))
    expect(deleteStub.calledOnceWith('my-space')).to.equal(true)
  })

  it('shows simple NAT warning for non-fir generation space', async function () {
    infoStub.resolves({
      created_at: now,
      generation: 'cedar',
      name: 'my-space',
      region: {name: 'my-region'},
      state: 'allocated',
      team: {name: 'my-team'},
    })
    natInfoStub.resolves({sources: ['1.1.1.1', '2.2.2.2'], state: 'enabled'})
    deleteStub.resolves(undefined)

    const {stderr} = await runCommand(Cmd, ['--space', 'my-space'])
    const replacer = /([»›])/g
    const actual = removeAllWhitespace(stderr.replaceAll(replacer, ''))
    expect(actual).to.include(removeAllWhitespace('Warning: Destructive Action'))
    expect(actual).to.include(removeAllWhitespace('This command will destroy the space ⬡ my-space'))
    expect(actual).to.include(removeAllWhitespace('=== WARNING: Outbound IPs Will Be Reused'))
    expect(actual).to.include(removeAllWhitespace('⚠️ Deleting this space frees up the following outbound IPv4 IPs for reuse:'))
    expect(actual).to.include(removeAllWhitespace('1.1.1.1, 2.2.2.2'))
    expect(actual).to.include(removeAllWhitespace('Update the following configurations:'))
    expect(actual).to.include(removeAllWhitespace('= IP allowlists'))
    expect(actual).to.include(removeAllWhitespace('= Firewall rules'))
    expect(actual).to.include(removeAllWhitespace('= Security group configurations'))
    expect(actual).to.include(removeAllWhitespace('= Network ACLs'))
    expect(actual).to.include(removeAllWhitespace('Ensure that you remove the listed IPv4 addresses from your security configurations.'))
    expect(actual).to.include(removeAllWhitespace('Destroying space ⬡ my-space... done'))
    expect(deleteStub.calledOnceWith('my-space')).to.equal(true)
  })
})
