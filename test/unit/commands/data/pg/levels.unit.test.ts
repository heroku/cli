import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'

import DataPgLevels from '../../../../../src/commands/data/pg/levels.js'
import {levelsResponse} from '../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../helpers/runCommand.js'

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

    await runCommand(DataPgLevels, [])

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.include('Name')
    expect(stdout.output).to.include('vCPU')
    expect(stdout.output).to.include('Memory (GB)')
    expect(stdout.output).to.include('Max Connections')
    expect(stdout.output).to.include('4G-Performance')
    expect(stdout.output).to.include('8G-Performance')
  })

  it('displays an empty table when no levels are available', async () => {
    dataApi
      .get('/data/postgres/v1/levels/advanced')
      .reply(200, {items: []})

    await runCommand(DataPgLevels, [])

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.include('Name')
    expect(stdout.output).to.include('vCPU')
    expect(stdout.output).to.include('Memory (GB)')
    expect(stdout.output).to.include('Max Connections')
    expect(stdout.output).not.to.include('4G-Performance')
    expect(stdout.output).not.to.include('8G-Performance')
  })

  it('handles API errors gracefully', async () => {
    dataApi
      .get('/data/postgres/v1/levels/advanced')
      .reply(500, {id: 'server_error', message: 'Internal Server Error'})

    try {
      await runCommand(DataPgLevels, [])
      expect.fail('Expected command to throw an error')
    } catch (error: unknown) {
      const err = error as Error
      expect(err.message).to.include('Internal Server Error')
    }
  })
})
