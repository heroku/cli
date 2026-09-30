import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import DataPgLogicalReplicationPublicationsInfo from '../../../../../../../src/commands/data/pg/logical-replication/publications/info.js'
import {addon} from '../../../../../../fixtures/data/pg/fixtures.js'
import removeAllWhitespace from '../../../../../../helpers/utils/remove-whitespaces.js'

const publication = {
  current_tables: ['public.orders'],
  name: 'orders',
  owner: 'u12345',
  target: {
    automatically_includes_new_schemas: false,
    automatically_includes_new_tables: false,
    tables: ['public.orders'],
    type: 'tables',
  },
}

const resolveAddon = () => nock('https://api.heroku.com')
  .post('/actions/addons/resolve')
  .reply(200, [{...addon, addon_service: {...addon.addon_service, name: 'heroku-postgresql'}}])

describe('data:pg:logical-replication:publications:info', function () {
  it('shows publication details', async function () {
    const herokuApi = resolveAddon()
    const dataApi = nock('https://api.data.heroku.com')
      .get(`/data/postgres/v1/${addon.id}/logical-replication/publications/orders`)
      .reply(200, publication)

    const {stdout} = await runCommand(DataPgLogicalReplicationPublicationsInfo, [
      'DATABASE', '--app=myapp', '--name=orders',
    ])

    herokuApi.done()
    dataApi.done()
    const actual = removeAllWhitespace(stdout)
    expect(actual).to.include(removeAllWhitespace('Name: orders'))
    expect(actual).to.include(removeAllWhitespace('Target: tables: public.orders'))
  })
})
