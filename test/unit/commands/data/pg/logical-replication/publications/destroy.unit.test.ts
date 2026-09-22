import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'

import DataPgLogicalReplicationPublicationsDestroy from '../../../../../../../src/commands/data/pg/logical-replication/publications/destroy.js'
import {addon} from '../../../../../../fixtures/data/pg/fixtures.js'

const resolveAddon = () => nock('https://api.heroku.com')
  .post('/actions/addons/resolve')
  .reply(200, [{...addon, addon_service: {...addon.addon_service, name: 'heroku-postgresql'}}])

describe('data:pg:logical-replication:publications:destroy', function () {
  it('destroys a publication with explicit confirmation', async function () {
    const herokuApi = resolveAddon()
    const dataApi = nock('https://api.data.heroku.com')
      .delete(`/data/postgres/v1/${addon.id}/logical-replication/publications/orders`)
      .reply(204)

    const {stderr} = await runCommand(DataPgLogicalReplicationPublicationsDestroy, [
      'DATABASE', '--app=myapp', '--name=orders', '--confirm=myapp',
    ])

    herokuApi.done()
    dataApi.done()
    expect(ansis.strip(stderr)).to.include('Destroying publication orders on')
    expect(ansis.strip(stderr)).to.include('advanced-horizontal-01234... done')
  })
})
