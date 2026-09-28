import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {restore, type SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/backups/cancel.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc.default

describe('pg:backups:cancel', function () {
  let cancelStub: SinonStub
  let sdkMock: MockSDK

  beforeEach(function () {
    cancelStub = stub().resolves({})
  })

  afterEach(function () {
    restore()
  })

  context('with no id', function () {
    let listByAppStub: SinonStub
    beforeEach(function () {
      listByAppStub = stub().resolves([
        {
          num: 3, succeeded: true, to_type: 'gof3r', uuid: '100-001',
        },
      ])
    })

    it('cancels backup', async function () {
      sdkMock = mockSDKData({transfer: {cancel: cancelStub, listByApp: listByAppStub}})

      const {stderr} = await runCommand(Cmd, [
        '--app',
        'myapp',
      ])

      expect(stderr).to.equal(heredoc`
        Cancelling b003... done
      `)
      expect(cancelStub.calledWith('myapp', '100-001')).to.be.true
    })
  })

  context('with id', function () {
    let infoByAppStub: SinonStub

    beforeEach(function () {
      infoByAppStub = stub().resolves({
        num: 3, succeeded: true, to_type: 'gof3r', uuid: '100-001',
      })
    })

    it('cancels backup', async function () {
      sdkMock = mockSDKData({transfer: {cancel: cancelStub, infoByApp: infoByAppStub}})

      const {stderr} = await runCommand(Cmd, [
        '--app',
        'myapp',
        'b003',
      ])

      expect(stderr).to.equal(heredoc`
        Cancelling b003... done
      `)
      expect(cancelStub.calledWith('myapp', '100-001')).to.be.true
    })
  })
})
