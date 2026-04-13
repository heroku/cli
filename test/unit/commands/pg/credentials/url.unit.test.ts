import {expect} from 'chai'
import nock from 'nock'
import {stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/credentials/url.js'
import * as fixtures from '../../../../fixtures/addons/fixtures.js'
import runCommand from '../../../../helpers/legacy-run-command.js'
import expectOutput from '../../../../helpers/utils/expectOutput.js'

const heredoc = tsheredoc.default

describe('pg:credentials:url', function () {
  const addon = fixtures.addons['dwh-db']
  const attachments = [fixtures.attachments['acme-inc-dwh::DATABASE']]

  afterEach(function () {
    nock.cleanAll()
  })

  it('shows the correct credentials', async function () {
    const roleInfo = {
      credentials: [
        {
          password: 'passw0rd', state: 'revoking', user: 'gandalf-rotating',
        }, {
          password: 'hunter2', state: 'active', user: 'gandalf',
        },
      ], database: 'd123', host: 'localhost', name: 'gandalf', port: 5442, state: 'created', uuid: 'aaaa',
    }
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.heroku.com')
      .get(`/addons/${addon.name}/addon-attachments`)
      .reply(200, attachments)
    nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.name}/credentials/gandalf`)
      .reply(200, roleInfo)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--name',
      'gandalf',
    ])
    expectOutput(stdout.output, heredoc(`
      Connection information for gandalf credential.
      Connection info string:
        "dbname=d123 host=localhost port=5442 user=gandalf password=hunter2 sslmode=require"
      Connection URL:
        postgres://gandalf:hunter2@localhost:5442/d123
    `))
  })

  it('throws an error when the db is starter plan but the name is specified', async function () {
    const hobbyAddon = fixtures.addons['www-db']
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon: hobbyAddon}])
    const err = 'Legacy Essential-tier databases do not support named credentials.'

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--name',
      'gandalf',
    ]).catch((error: Error) => {
      expect(error.message).to.equal(err)
    })
  })

  it('shows the credentials when the db is numbered essential plan', async function () {
    const roleInfo = {
      credentials: [
        {
          password: 'passw0rd', state: 'revoking', user: 'lucy-rotating',
        }, {
          password: 'hunter2', state: 'active', user: 'lucy',
        },
      ], database: 'd123', host: 'localhost', name: 'lucy', port: 5442, state: 'created', uuid: 'bbbb',
    }
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${addon.name}/credentials/lucy`)
      .reply(200, roleInfo)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--name',
      'lucy',
    ])
    expectOutput(stdout.output, heredoc(`
      Connection information for lucy credential.
      Connection info string:
        "dbname=d123 host=localhost port=5442 user=lucy password=hunter2 sslmode=require"
      Connection URL:
        postgres://lucy:hunter2@localhost:5442/d123
    `))
  })

  it('shows the correct credentials with starter plan', async function () {
    const hobbyAddon = fixtures.addons['www-db']
    const roleInfo = {
      credentials: [
        {
          password: 'hunter2', state: 'active', user: 'abcdef',
        },
      ], database: 'd123', host: 'localhost', name: 'default', port: 5442, state: 'created', uuid: null,
    }
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon: hobbyAddon}])
    nock('https://api.data.heroku.com')
      .get(`/postgres/v0/databases/${hobbyAddon.name}/credentials/default`)
      .reply(200, roleInfo)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expectOutput(stdout.output, heredoc(`
      Connection information for default credential.
      Connection info string:
        "dbname=d123 host=localhost port=5442 user=abcdef password=hunter2 sslmode=require"
      Connection URL:
        postgres://abcdef:hunter2@localhost:5442/d123
    `))
  })
})
