import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {restore, type SinonStub, stub} from 'sinon'

import Cmd from '../../../../../src/commands/pg/backups/delete.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

describe('pg:backups:delete', function () {
  let deleteStub: SinonStub
  let sdkMock: MockSDK

  beforeEach(function () {
    deleteStub = stub().resolves({url: 'https://dburl'})
  })

  afterEach(function () {
    restore()
  })

  it('deletes the backup', async function () {
    sdkMock = mockSDKData({
      transfer: {
        deleteByApp: deleteStub,
        listByApp: stub().resolves([
          {num: 3, succeeded: true, to_type: 'gof3r'},
        ]),
      },
    })
    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
      'b003',
    ])
    expect(stderr).to.equal('Deleting backup b003 on ⬢ myapp... done\n')
    expect(deleteStub.calledWith('myapp', '3')).to.be.true
  })
})
