import {stderr, stdout} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/pg/credentials/destroy'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import expectOutput from '../../../../helpers/utils/expectOutput'
import {expect} from 'chai'
import heredoc from 'tsheredoc'
import stripAnsi = require('strip-ansi')

describe('pg:credentials:destroy', function () {
  const addon = {
    name: 'postgres-1', plan: {name: 'heroku-postgresql:standard-0'},
  }

  afterEach(function () {
    nock.cleanAll()
  })

  it('destroys the credential', async function () {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.data.heroku.com')
      .delete('/postgres/v0/databases/postgres-1/credentials/credname')
      .reply(200)
    const attachments = [
      {
        app: {name: 'myapp'}, addon: {id: 100, name: 'postgres-1'}, config_vars: ['HEROKU_POSTGRESQL_PINK_URL'],
      },
    ]
    nock('https://api.heroku.com')
      .get('/addons/postgres-1/addon-attachments')
      .reply(200, attachments)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--name',
      'credname',
      '--confirm',
      'myapp',
    ])
    expectOutput(stderr.output, heredoc(`
      Destroying credential credname...
      Destroying credential credname... done
    `))
    expectOutput(stdout.output, heredoc(`
      The credential has been destroyed within postgres-1.
      Database objects owned by credname will be assigned to the default credential.
    `))
  })

  it('throws an error when the db is starter plan', async function () {
    const hobbyAddon = {
      name: 'postgres-1', plan: {name: 'heroku-postgresql:hobby-dev'},
    }
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon: hobbyAddon}])

    const err = "You can't destroy the default credential on Essential-tier databases."
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--name',
      'jeff',
    ]).catch((error: Error) => {
      expect(error.message).to.equal(err)
    })
  })

  it('throws an error when the db is numbered essential plan', async function () {
    const essentialAddon = {
      name: 'postgres-1', plan: {name: 'heroku-postgresql:essential-0'},
    }
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon: essentialAddon}])
    const err = "You can't destroy the default credential on Essential-tier databases."
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--name',
      'gandalf',
    ]).catch((error: Error) => {
      expect(error.message).to.equal(err)
    })
  })

  it('throws an error when the credential is still used for an attachment', async function () {
    const attachments = [
      {
        app: {name: 'myapp'}, addon: {id: 100, name: 'postgres-1'}, config_vars: ['HEROKU_POSTGRESQL_PINK_URL'],
      }, {
        app: {name: 'otherapp'}, addon: {id: 100, name: 'postgres-1'}, namespace: 'credential:gandalf', config_vars: ['HEROKU_POSTGRESQL_PURPLE_URL'],
      },
    ]
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.heroku.com')
      .get('/addons/postgres-1/addon-attachments')
      .reply(200, attachments)
    const err = 'Credential gandalf must be detached from the app ⬢ otherapp before destroying.'
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--name',
      'gandalf',
    ]).catch((error: Error) => {
      expect(stripAnsi(error.message)).to.equal(err)
    })
  })

  it('only mentions an app with multiple attachments once', async function () {
    const attachments = [
      {
        app: {name: 'myapp'}, addon: {id: 100, name: 'postgres-1'}, config_vars: ['HEROKU_POSTGRESQL_PINK_URL'],
      }, {
        app: {name: 'otherapp'}, addon: {id: 100, name: 'postgres-1'}, namespace: 'credential:gandalf', config_vars: ['HEROKU_POSTGRESQL_PURPLE_URL'],
      }, {
        app: {name: 'otherapp'}, addon: {id: 100, name: 'postgres-1'}, namespace: 'credential:gandalf', config_vars: ['HEROKU_POSTGRESQL_RED_URL'],
      }, {
        app: {name: 'yetanotherapp'}, addon: {id: 100, name: 'postgres-1'}, namespace: 'credential:gandalf', config_vars: ['HEROKU_POSTGRESQL_BLUE_URL'],
      },
    ]
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.heroku.com')
      .get('/addons/postgres-1/addon-attachments')
      .reply(200, attachments)
    const err = 'Credential gandalf must be detached from the apps ⬢ otherapp, ⬢ yetanotherapp before destroying.'
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--name',
      'gandalf',
    ]).catch((error: Error) => {
      expect(stripAnsi(error.message)).to.equal(err)
    })
  })
})
