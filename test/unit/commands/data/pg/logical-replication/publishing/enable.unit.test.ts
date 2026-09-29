import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'

import DataPgLogicalReplicationPublishingEnable from '../../../../../../../src/commands/data/pg/logical-replication/publishing/enable.js'
import {addon} from '../../../../../../fixtures/data/pg/fixtures.js'

const resolveAddon = () => nock('https://api.heroku.com')
  .post('/actions/addons/resolve')
  .reply(200, [{...addon, addon_service: {...addon.addon_service, name: 'heroku-postgresql'}}])

describe('data:pg:logical-replication:publishing:enable', function () {
  it('enables publishing and explains how to track the asynchronous operation', async function () {
    const herokuApi = resolveAddon()
    const dataApi = nock('https://api.data.heroku.com')
      .post(`/data/postgres/v1/${addon.id}/logical-replication/publishing/enable`)
      .reply(202)

    const {error, stderr, stdout} = await runCommand(DataPgLogicalReplicationPublishingEnable, ['DATABASE', '--app=myapp'])

    expect(error).to.be.undefined
    herokuApi.done()
    dataApi.done()
    expect(ansis.strip(stderr)).to.include('Enabling logical replication publishing for')
    expect(ansis.strip(stderr)).to.include('advanced-horizontal-01234... requested')
    expect(ansis.strip(stdout)).to.include('to finish updating before creating publications.')
  })

  it('shows a failure marker and the API error when enablement fails', async function () {
    const herokuApi = resolveAddon()
    const dataApi = nock('https://api.data.heroku.com')
      .post(`/data/postgres/v1/${addon.id}/logical-replication/publishing/enable`)
      .reply(500, {message: 'publishing could not be enabled'})

    const {error, stderr} = await runCommand(DataPgLogicalReplicationPublishingEnable, ['DATABASE', '--app=myapp'])

    herokuApi.done()
    dataApi.done()
    expect(ansis.strip(stderr)).to.include('Enabling logical replication publishing for')
    expect(ansis.strip(stderr)).to.include('... !')
    expect((error as Error).message).to.include('publishing could not be enabled')
  })
})
