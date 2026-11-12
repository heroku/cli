import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'

import Cmd from '../../../../../src/commands/pg/credentials/create.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

type FakeData = {
  postgresDatabase: {createCredentials: SinonStub}
}

function buildFakeData(): FakeData {
  return {postgresDatabase: {createCredentials: stub()}}
}

describe('pg:credentials:create', function () {
  let fakeData: FakeData
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = buildFakeData()
    sdkMock = mockSDKData(fakeData)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('creates the credential', async function () {
    const addon = {
      name: 'postgres-1', plan: {name: 'heroku-postgresql:standard-0'},
    }
    fakeData.postgresDatabase.createCredentials.resolves({addon, result: {message: 'created'}})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--name',
      'credname',
    ])
    expect(stdout).to.equal('\nPlease attach the credential to the apps you want to use it in by running heroku addons:attach postgres-1 --credential credname -a myapp.\nPlease define the new grants for the credential within Postgres: heroku pg:psql postgres-1 -a myapp.\n')
    expect(stderr).to.equal('Creating credential credname... done\n')
    expect(fakeData.postgresDatabase.createCredentials.calledOnceWithExactly('myapp', {name: 'credname'}, {addonIdentity: undefined})).to.equal(true)
  })

  it('propagates errors from createCredentials', async function () {
    const err = "You can't create a custom credential on Essential-tier databases."
    fakeData.postgresDatabase.createCredentials.rejects(new Error(err))

    const {error} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--name',
      'jeff',
    ])
    expect(error!.message).to.contain(err)
  })
})
