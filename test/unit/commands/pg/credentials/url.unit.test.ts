import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/credentials/url.js'
import * as fixtures from '../../../../fixtures/addons/fixtures.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

type FakeData = {
  postgresDatabase: {getUrl: SinonStub}
}

function buildFakeData(): FakeData {
  return {postgresDatabase: {getUrl: stub()}}
}

describe('pg:credentials:url', function () {
  const addon = fixtures.addons['dwh-db']
  let fakeData: FakeData
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = buildFakeData()
    sdkMock = mockSDKData(fakeData)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('shows the correct credentials', async function () {
    fakeData.postgresDatabase.getUrl.resolves({
      addon,
      credentialConnectionInfo: {
        credName: 'gandalf',
        database: 'd123',
        host: 'localhost',
        password: 'hunter2',
        port: 5442,
        url: 'postgres://gandalf:hunter2@localhost:5442/d123',
        user: 'gandalf',
      },
    })

    const {stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--name',
      'gandalf',
    ])
    expectOutput(stdout, heredoc(`
      Connection information for gandalf credential.
      Connection info string:
        "dbname=d123 host=localhost port=5442 user=gandalf password=hunter2 sslmode=require"
      Connection URL:
        postgres://gandalf:hunter2@localhost:5442/d123
    `))
    expect(fakeData.postgresDatabase.getUrl.calledOnceWithExactly('myapp', 'gandalf', {addonIdentity: undefined})).to.equal(true)
  })

  it('throws an error when the db is starter plan but the name is specified', async function () {
    const err = 'Legacy Essential-tier databases do not support named credentials.'
    fakeData.postgresDatabase.getUrl.rejects(new Error(err))

    const {error} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--name',
      'gandalf',
    ])
    expect(error!.message).to.equal(err)
  })

  it('shows the credentials when the db is numbered essential plan', async function () {
    fakeData.postgresDatabase.getUrl.resolves({
      addon,
      credentialConnectionInfo: {
        credName: 'lucy',
        database: 'd123',
        host: 'localhost',
        password: 'hunter2',
        port: 5442,
        url: 'postgres://lucy:hunter2@localhost:5442/d123',
        user: 'lucy',
      },
    })

    const {stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--name',
      'lucy',
    ])
    expectOutput(stdout, heredoc(`
      Connection information for lucy credential.
      Connection info string:
        "dbname=d123 host=localhost port=5442 user=lucy password=hunter2 sslmode=require"
      Connection URL:
        postgres://lucy:hunter2@localhost:5442/d123
    `))
  })

  it('shows the correct credentials with starter plan', async function () {
    fakeData.postgresDatabase.getUrl.resolves({
      addon,
      credentialConnectionInfo: {
        credName: 'default',
        database: 'd123',
        host: 'localhost',
        password: 'hunter2',
        port: 5442,
        url: 'postgres://abcdef:hunter2@localhost:5442/d123',
        user: 'abcdef',
      },
    })

    const {stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expectOutput(stdout, heredoc(`
      Connection information for default credential.
      Connection info string:
        "dbname=d123 host=localhost port=5442 user=abcdef password=hunter2 sslmode=require"
      Connection URL:
        postgres://abcdef:hunter2@localhost:5442/d123
    `))
    expect(fakeData.postgresDatabase.getUrl.calledOnceWithExactly('myapp', 'default', {addonIdentity: undefined})).to.equal(true)
  })
})
