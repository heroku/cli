import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import DataPgLevels from '../../../../../src/commands/data/pg/levels.js'
import {levelsResponse} from '../../../../fixtures/data/pg/fixtures.js'

interface FakeData {
  postgresLevel: {info: SinonStub}
}

describe('data:pg:levels', () => {
  let fakeData: FakeData

  beforeEach(() => {
    fakeData = {postgresLevel: {info: stub()}}
    stub(HerokuSDK.prototype, 'data').get(() => fakeData)
  })

  afterEach(() => {
    restore()
  })

  it('displays available levels for advanced databases', async () => {
    fakeData.postgresLevel.info.resolves(levelsResponse)

    const {stderr, stdout} = await runCommand(DataPgLevels, [])

    expect(stderr).to.equal('')
    expect(stdout).to.include('Name')
    expect(stdout).to.include('vCPU')
    expect(stdout).to.include('Memory (GB)')
    expect(stdout).to.include('Max Connections')
    expect(stdout).to.include('4G-Performance')
    expect(stdout).to.include('8G-Performance')
    expect(fakeData.postgresLevel.info.calledOnceWithExactly('advanced')).to.equal(true)
  })

  it('displays an empty table when no levels are available', async () => {
    fakeData.postgresLevel.info.resolves({items: []})

    const {stderr, stdout} = await runCommand(DataPgLevels, [])

    expect(stderr).to.equal('')
    expect(stdout).to.include('Name')
    expect(stdout).to.include('vCPU')
    expect(stdout).to.include('Memory (GB)')
    expect(stdout).to.include('Max Connections')
    expect(stdout).not.to.include('4G-Performance')
    expect(stdout).not.to.include('8G-Performance')
  })

  it('handles API errors gracefully', async () => {
    fakeData.postgresLevel.info.rejects(new Error('Internal Server Error'))

    const {error} = await runCommand(DataPgLevels, [])
    expect(error).to.exist
    const err = error as Error
    expect(err.message).to.include('Internal Server Error')
  })
})
