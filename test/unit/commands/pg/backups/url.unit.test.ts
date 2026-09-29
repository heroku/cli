import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {restore, type SinonStub, stub} from 'sinon'

import Cmd from '../../../../../src/commands/pg/backups/url.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

describe('pg:backups:url', function () {
  let publicUrlStub: SinonStub
  let sdkMock: MockSDK

  beforeEach(function () {
    publicUrlStub = stub().resolves({url: 'https://dburl'})
  })

  afterEach(function () {
    restore()
  })

  context('with no id', function () {
    beforeEach(function () {
      sdkMock = mockSDKData({
        transfer: {
          listByApp: stub().resolves([
            {num: 3, succeeded: true, to_type: 'gof3r'},
          ]),
          publicUrl: publicUrlStub,
        },
      })
    })

    it('shows URL', async function () {
      const {stdout} = await runCommand(Cmd, ['--app', 'myapp'])
      expectOutput(stdout, 'https://dburl')
      expect(publicUrlStub.calledOnceWithExactly('myapp', '3', {})).to.equal(true)
    })
  })

  context('with id', function () {
    it('shows URL', async function () {
      sdkMock = mockSDKData({transfer: {publicUrl: publicUrlStub}})

      const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'b003'])
      expectOutput(stdout, 'https://dburl')
      expect(publicUrlStub.calledOnceWithExactly('myapp', '3', {})).to.equal(true)
    })
  })
})
