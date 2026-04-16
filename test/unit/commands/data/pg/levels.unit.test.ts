import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import DataPgLevels from '../../../../../src/commands/data/pg/levels.js'
import {levelsResponse} from '../../../../fixtures/data/pg/fixtures.js'

describe('data:pg:levels', () => {
  let dataApi: nock.Scope

  beforeEach(() => {
    dataApi = nock('https://api.data.heroku.com')
  })

  afterEach(() => {
    dataApi.done()
  })

  it('displays available levels for advanced databases', async () => {
    dataApi
      .get('/data/postgres/v1/levels/advanced')
      .reply(200, levelsResponse)

    const {stderr, stdout} = await runCommand(DataPgLevels, [])

    expect(stderr).to.equal('')
    expect(stdout).to.include('Name')
    expect(stdout).to.include('vCPU')
    expect(stdout).to.include('Memory (GB)')
    expect(stdout).to.include('Max Connections')
    expect(stdout).to.include('4G-Performance')
    expect(stdout).to.include('8G-Performance')
  })

  it('displays an empty table when no levels are available', async () => {
    dataApi
      .get('/data/postgres/v1/levels/advanced')
      .reply(200, {items: []})

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
    dataApi
      .get('/data/postgres/v1/levels/advanced')
      .reply(500, {id: 'server_error', message: 'Internal Server Error'})

    const {error} = await runCommand(DataPgLevels, [])
    expect.fail('Expected command to throw an error')
    const err = error as Error
    expect(err.message).to.include('Internal Server Error')
  })
})
