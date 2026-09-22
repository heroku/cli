import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'

import DataPgLogicalReplicationPublicationsUpdate from '../../../../../../../src/commands/data/pg/logical-replication/publications/update.js'
import {addon} from '../../../../../../fixtures/data/pg/fixtures.js'

const resolveAddon = () => nock('https://api.heroku.com')
  .post('/actions/addons/resolve')
  .reply(200, [{...addon, addon_service: {...addon.addon_service, name: 'heroku-postgresql'}}])

describe('data:pg:logical-replication:publications:update', function () {
  it('replaces a publication target', async function () {
    const herokuApi = resolveAddon()
    const dataApi = nock('https://api.data.heroku.com')
      .put(`/data/postgres/v1/${addon.id}/logical-replication/publications/orders`, {
        target: {schemas: ['public'], type: 'schemas'},
      })
      .reply(204)

    const {stderr} = await runCommand(DataPgLogicalReplicationPublicationsUpdate, [
      'DATABASE', '--app=myapp', '--name=orders', '--schema=public',
    ])

    herokuApi.done()
    dataApi.done()
    expect(ansis.strip(stderr)).to.include('Updating publication orders on')
    expect(ansis.strip(stderr)).to.include('advanced-horizontal-01234... done')
  })

  it('replaces a publication target with all current customer schemas', async function () {
    const herokuApi = resolveAddon()
    const dataApi = nock('https://api.data.heroku.com')
      .put(`/data/postgres/v1/${addon.id}/logical-replication/publications/orders`, {
        target: {type: 'all_customer_schemas'},
      })
      .reply(204)

    const {stdout} = await runCommand(DataPgLogicalReplicationPublicationsUpdate, [
      'DATABASE', '--app=myapp', '--name=orders', '--all-schemas',
    ])

    herokuApi.done()
    dataApi.done()
    expect(ansis.strip(stdout)).to.equal('The publication includes all current customer schemas. Tables created later and new schemas are not added automatically.\n')
  })
})
