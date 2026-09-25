import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'

import DataPgLogicalReplicationSubscribingEnable from '../../../../../../../src/commands/data/pg/logical-replication/subscribing/enable.js'
import {addon} from '../../../../../../fixtures/data/pg/fixtures.js'

const resolveAddon = () => nock('https://api.heroku.com')
  .post('/actions/addons/resolve')
  .reply(200, [{...addon, addon_service: {...addon.addon_service, name: 'heroku-postgresql'}}])

describe('data:pg:logical-replication:subscribing:enable', function () {
  it('enables subscribing and explains how to track the asynchronous operation', async function () {
    const herokuApi = resolveAddon()
    const dataApi = nock('https://api.data.heroku.com')
      .post(`/data/postgres/v1/${addon.id}/logical-replication/subscribing/enable`)
      .reply(202)

    const {stderr, stdout} = await runCommand(DataPgLogicalReplicationSubscribingEnable, ['DATABASE', '--app=myapp'])

    herokuApi.done()
    dataApi.done()
    expect(ansis.strip(stderr)).to.include('Enabling logical replication subscribing for')
    expect(ansis.strip(stderr)).to.include('advanced-horizontal-01234... requested')
    expect(ansis.strip(stdout)).to.include('to finish updating before creating subscriptions.')
  })

  it('shows a failure marker and the API error when enablement fails', async function () {
    const herokuApi = resolveAddon()
    const dataApi = nock('https://api.data.heroku.com')
      .post(`/data/postgres/v1/${addon.id}/logical-replication/subscribing/enable`)
      .reply(500, {message: 'subscribing could not be enabled'})

    const {error, stderr} = await runCommand(DataPgLogicalReplicationSubscribingEnable, ['DATABASE', '--app=myapp'])

    herokuApi.done()
    dataApi.done()
    expect(ansis.strip(stderr)).to.include('Enabling logical replication subscribing for')
    expect(ansis.strip(stderr)).to.include('... !')
    expect((error as Error).message).to.include('subscribing could not be enabled')
  })
})
