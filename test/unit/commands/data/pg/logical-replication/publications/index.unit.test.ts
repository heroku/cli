import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'

import DataPgLogicalReplicationPublicationsIndex from '../../../../../../../src/commands/data/pg/logical-replication/publications/index.js'
import {addon, nonAdvancedAddon} from '../../../../../../fixtures/data/pg/fixtures.js'
import removeAllWhitespace from '../../../../../../helpers/utils/remove-whitespaces.js'

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

describe('data:pg:logical-replication:publications', function () {
  it('errors when used with a non-Advanced-tier database', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [nonAdvancedAddon])

    const {error} = await runCommand(DataPgLogicalReplicationPublicationsIndex, ['DATABASE', '--app=myapp'])

    herokuApi.done()
    expect(ansis.strip((error as Error).message)).to.equal('You can only use this command on Advanced-tier databases.\nUse heroku data:pg:info DATABASE --app myapp to inspect an Advanced database.')
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
})
