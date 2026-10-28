import {runCommand} from '@heroku-cli/test-utils'
import {NotAdvancedDatabaseError} from '@heroku/sdk/resources/data/postgres-database'
import ansis from 'ansis'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import DataPgUpgradeRun from '../../../../../../src/commands/data/pg/upgrade/run.js'
import {advancedAddon, standardAddon} from '../../../../../fixtures/data/pg/fixtures.js'
import {mockSDKData} from '../../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

type FakeData = {
  postgres: {runUpgrade: SinonStub}
}

function buildFakeData(): FakeData {
  return {postgres: {runUpgrade: stub()}}
}

describe('data:pg:upgrade:run', function () {
  let fakeData: FakeData
  let sdkMock: ReturnType<typeof mockSDKData>

  beforeEach(function () {
    fakeData = buildFakeData()
    sdkMock = mockSDKData(fakeData)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('upgrades an advanced database to the latest version', async function () {
    fakeData.postgres.runUpgrade.callsFake(async (_app, _database, _body, options) => {
      await options?.beforeRunUpgrade?.({addon: advancedAddon, currentVersion: '16.10'})
      return {addon: advancedAddon, result: {message: 'Upgrade started. Monitor progress with heroku data:pg:info.'}}
    })

    const {stderr, stdout} = await runCommand(DataPgUpgradeRun, [
      advancedAddon.name,
      '--app=myapp',
      '--confirm=myapp',
    ])

    expect(ansis.strip(stderr)).to.equal(heredoc(`
        Upgrading your ⛁ ${advancedAddon.name} database from 16.10 to the latest supported Postgres version... done
        Upgrade started. Use heroku data:pg:upgrade:wait ${advancedAddon.name} -a myapp to monitor progress.
      `))
    expect(stdout).to.equal('')
    expect(fakeData.postgres.runUpgrade.firstCall.args[0]).to.equal('myapp')
    expect(fakeData.postgres.runUpgrade.firstCall.args[1]).to.equal(advancedAddon.name)
    expect(fakeData.postgres.runUpgrade.firstCall.args[2]).to.deep.equal({version: undefined})
  })

  it('upgrades an advanced database to a specific version with --version', async function () {
    fakeData.postgres.runUpgrade.callsFake(async (_app, _database, _body, options) => {
      await options?.beforeRunUpgrade?.({addon: advancedAddon, currentVersion: '16.10'})
      return {addon: advancedAddon, result: {message: 'Backend returned message should be ignored.'}}
    })

    const {stderr} = await runCommand(DataPgUpgradeRun, [
      advancedAddon.name,
      '--app=myapp',
      '--confirm=myapp',
      '--version=17.5',
    ])

    expect(ansis.strip(stderr)).to.include('from 16.10 to 17.5')
    expect(ansis.strip(stderr)).to.include('Upgrade started.')
    expect(ansis.strip(stderr)).not.to.include('Backend returned message should be ignored.')
    expect(fakeData.postgres.runUpgrade.firstCall.args[2]).to.deep.equal({version: '17.5'})
  })

  it('errors if database is not Advanced-tier', async function () {
    fakeData.postgres.runUpgrade.rejects(new NotAdvancedDatabaseError(standardAddon, 'not an advanced-tier database'))

    const {error} = await runCommand(DataPgUpgradeRun, [
      standardAddon.name,
      '--app=myapp',
      '--confirm=myapp',
    ])

    expect(ansis.strip((error as Error).message)).to.equal('You can only use this command on Advanced-tier databases.\n'
          + `Use heroku pg:upgrade:run ${standardAddon.name} --app myapp instead.`)
  })

  it('displays the correct error when the upgrade API fails', async function () {
    fakeData.postgres.runUpgrade.callsFake(async (_app, _database, _body, options) => {
      await options?.beforeRunUpgrade?.({addon: advancedAddon, currentVersion: '16.10'})
      throw new Error('Database is not ready for upgrade.')
    })

    const {error} = await runCommand(DataPgUpgradeRun, [
      advancedAddon.name,
      '--app=myapp',
      '--confirm=myapp',
    ])

    expect(ansis.strip((error as Error).message)).to.include('Database is not ready for upgrade.')
  })
})
