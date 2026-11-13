import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {match, SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/credentials/repair-default.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

type FakeData = {
  postgresDatabase: {repairDefault: SinonStub}
}

function buildFakeData(): FakeData {
  return {postgresDatabase: {repairDefault: stub()}}
}

describe('pg:credentials:repair-default', function () {
  const addon = {
    name: 'postgres-1', plan: {name: 'heroku-postgresql:standard-0'},
  }

  let fakeData: FakeData
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = buildFakeData()
    sdkMock = mockSDKData(fakeData)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('resets the credential permissions', async function () {
    fakeData.postgresDatabase.repairDefault.callsFake(async (_appIdentity, options) => {
      await options?.beforeRepair?.({addon})
      return {addon, result: {message: 'done'}}
    })

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ])
    expectOutput(stdout, '')
    expectOutput(stderr, heredoc(`
      Resetting permissions and object ownership for default role to factory settings... done
    `))
    expect(fakeData.postgresDatabase.repairDefault.calledOnceWithExactly(
      'myapp',
      {addonIdentity: undefined, beforeRepair: match.func},
    )).to.equal(true)
  })

  it('propagates errors from repairDefault', async function () {
    const err = "You can't perform this operation on Essential-tier databases."
    fakeData.postgresDatabase.repairDefault.rejects(new Error(err))

    const {error} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ])
    expect(error!.message).to.equal(err)
  })
})
