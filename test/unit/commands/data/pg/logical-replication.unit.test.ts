import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'

import DataPgLogicalReplicationPublicationsCreate from '../../../../../src/commands/data/pg/logical-replication/publications/create.js'
import DataPgLogicalReplicationPublicationsDestroy from '../../../../../src/commands/data/pg/logical-replication/publications/destroy.js'
import DataPgLogicalReplicationPublicationsIndex from '../../../../../src/commands/data/pg/logical-replication/publications/index.js'
import DataPgLogicalReplicationPublicationsInfo from '../../../../../src/commands/data/pg/logical-replication/publications/info.js'
import DataPgLogicalReplicationPublicationsUpdate from '../../../../../src/commands/data/pg/logical-replication/publications/update.js'
import DataPgLogicalReplicationPublishingEnable from '../../../../../src/commands/data/pg/logical-replication/publishing/enable.js'
import DataPgLogicalReplicationSubscribingEnable from '../../../../../src/commands/data/pg/logical-replication/subscribing/enable.js'
import {addon} from '../../../../fixtures/data/pg/fixtures.js'
import removeAllWhitespace from '../../../../helpers/utils/remove-whitespaces.js'

const publicationsResponse = {
  count: 1,
  items: [{
    current_tables: ['public.orders'],
    name: 'orders',
    owner: 'u12345',
    target: {
      automatically_includes_new_schemas: false,
      automatically_includes_new_tables: false,
      tables: ['public.orders'],
      type: 'tables',
    },
  }],
  limit: 50,
}

const resolveAddon = () => nock('https://api.heroku.com')
  .post('/actions/addons/resolve')
  .reply(200, [{...addon, addon_service: {...addon.addon_service, name: 'heroku-postgresql'}}])

describe('data:pg:logical-replication', function () {
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

  it('lists publications', async function () {
    const herokuApi = resolveAddon()
    const dataApi = nock('https://api.data.heroku.com')
      .get(`/data/postgres/v1/${addon.id}/logical-replication/publications`)
      .reply(200, publicationsResponse)

    const {stdout} = await runCommand(DataPgLogicalReplicationPublicationsIndex, ['DATABASE', '--app=myapp'])

    herokuApi.done()
    dataApi.done()
    const actual = removeAllWhitespace(stdout)
    expect(actual).to.include(removeAllWhitespace('Name New Tables Owner Target'))
    expect(actual).to.include(removeAllWhitespace('orders not included u12345 tables: public.orders'))
  })

  it('shows publication details', async function () {
    const herokuApi = resolveAddon()
    const dataApi = nock('https://api.data.heroku.com')
      .get(`/data/postgres/v1/${addon.id}/logical-replication/publications/orders`)
      .reply(200, publicationsResponse.items[0])

    const {stdout} = await runCommand(DataPgLogicalReplicationPublicationsInfo, [
      'DATABASE', '--app=myapp', '--name=orders',
    ])

    herokuApi.done()
    dataApi.done()
    const actual = removeAllWhitespace(stdout)
    expect(actual).to.include(removeAllWhitespace('Name: orders'))
    expect(actual).to.include(removeAllWhitespace('Target: tables: public.orders'))
  })

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
