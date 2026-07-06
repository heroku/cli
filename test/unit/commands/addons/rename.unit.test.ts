import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {stub} from 'sinon'

import Cmd from '../../../../src/commands/addons/rename.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

describe('addons:rename', function () {
  let sdkMock: MockSDK

  afterEach(function () {
    sdkMock.restore()
  })

  context('when the add-on exists', function () {
    it('renames the add-on', async function () {
      const redis = fixtures.addons['www-redis']!
      const redis_name = redis.name!
      const infoStub = stub().resolves(redis)
      const updateStub = stub().resolves({...redis, name: 'cache-redis'})
      const fakePlatform = {
        addOn: {info: infoStub, update: updateStub},
      }
      sdkMock = mockSDKPlatform(fakePlatform)

      const {stdout} = await runCommand(Cmd, [redis_name, 'cache-redis'])
      expect(infoStub.calledOnceWith(redis_name)).to.be.true
      expect(updateStub.calledOnceWith(redis.app?.id, redis.id, {name: 'cache-redis', plan: redis.plan!.name})).to.be.true
      expectOutput(stdout, `${redis_name} successfully renamed to cache-redis.`)
    })
  })
  context('when the add-on does not exist', function () {
    it('displays an appropriate error', async function () {
      const infoStub = stub().rejects(new Error("Couldn't find that add-on."))
      const fakePlatform = {
        addOn: {info: infoStub, update: stub()},
      }
      sdkMock = mockSDKPlatform(fakePlatform)

      await runCommand(Cmd, ['not-an-addon', 'cache-redis'])
        .catch(error => expect(error.message).to.contain("Couldn't find that add-on."))
    })
  })
})
