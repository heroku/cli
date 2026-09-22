import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'

import DataPgLogicalReplicationPublicationsCreate from '../../../../../../../src/commands/data/pg/logical-replication/publications/create.js'
import {addon} from '../../../../../../fixtures/data/pg/fixtures.js'

const resolveAddon = () => nock('https://api.heroku.com')
  .post('/actions/addons/resolve')
  .reply(200, [{...addon, addon_service: {...addon.addon_service, name: 'heroku-postgresql'}}])

describe('data:pg:logical-replication:publications:create', function () {
  it('creates table-scoped publications', async function () {
    const herokuApi = resolveAddon()
    const dataApi = nock('https://api.data.heroku.com')
      .post(`/data/postgres/v1/${addon.id}/logical-replication/publications`, {
        name: 'orders', target: {tables: ['public.orders', 'public.order_items'], type: 'tables'},
      })
      .reply(201)

    const {stderr} = await runCommand(DataPgLogicalReplicationPublicationsCreate, [
      'DATABASE', '--app=myapp', '--name=orders', '--table=public.orders', '--table=public.order_items',
    ])

    herokuApi.done()
    dataApi.done()
    expect(ansis.strip(stderr)).to.include('Creating publication orders on')
    expect(ansis.strip(stderr)).to.include('advanced-horizontal-01234... done')
  })

  it('requires exactly one publication target type', async function () {
    const herokuApi = resolveAddon()
    const {error} = await runCommand(DataPgLogicalReplicationPublicationsCreate, [
      'DATABASE', '--app=myapp', '--name=orders', '--table=public.orders', '--schema=public',
    ])

    herokuApi.done()
    expect((error as Error).message).to.equal('Specify either --table or --schema, not both.')
  })

  it('creates a publication for all current customer schemas', async function () {
    const herokuApi = resolveAddon()
    const dataApi = nock('https://api.data.heroku.com')
      .post(`/data/postgres/v1/${addon.id}/logical-replication/publications`, {
        name: 'application', target: {type: 'all_customer_schemas'},
      })
      .reply(201)

    const {stdout} = await runCommand(DataPgLogicalReplicationPublicationsCreate, [
      'DATABASE', '--app=myapp', '--name=application', '--all-schemas',
    ])

    herokuApi.done()
    dataApi.done()
    expect(ansis.strip(stdout)).to.equal('The publication includes all current customer schemas. Tables created later and new schemas are not added automatically.\n')
  })
})
