import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/credentials/destroy.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

type FakeData = {
  postgresDatabase: {deleteCredential: SinonStub}
}

function buildFakeData(): FakeData {
  return {postgresDatabase: {deleteCredential: stub()}}
}

describe('pg:credentials:destroy', function () {
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

  it('destroys the credential', async function () {
    fakeData.postgresDatabase.deleteCredential.resolves({addon, result: {message: 'destroyed'}})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--name',
      'credname',
      '--confirm',
      'myapp',
    ])
    expectOutput(stderr, heredoc(`
      Destroying credential credname... done
    `))
    expectOutput(stdout, heredoc(`
      The credential has been destroyed within postgres-1.
      Database objects owned by credname will be assigned to the default credential.
    `))
    expect(fakeData.postgresDatabase.deleteCredential.calledOnceWithExactly('myapp', 'credname', {addonIdentity: undefined})).to.equal(true)
  })

  it('propagates errors from deleteCredential', async function () {
    const err = 'Credential gandalf must be detached from the apps otherapp, yetanotherapp before destroying.'
    fakeData.postgresDatabase.deleteCredential.rejects(new Error(err))

    const {error} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--name',
      'gandalf',
      '--confirm',
      'myapp',
    ])
    expect(error!.message).to.equal(err)
  })
})
