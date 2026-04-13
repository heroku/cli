import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/credentials/destroy.js'
import runCommand from '../../../../helpers/legacy-run-command.js'
import expectOutput from '../../../../helpers/utils/expectOutput.js'

const heredoc = tsheredoc.default

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
        addon: {id: 100, name: 'postgres-1'}, app: {name: 'myapp'}, config_vars: ['HEROKU_POSTGRESQL_PINK_URL'],
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
      Destroying credential credname... done
    `))
    expectOutput(stdout.output, heredoc(`
      The credential has been destroyed within postgres-1.
      Database objects owned by credname will be assigned to the default credential.
    `))
  })

  it('throws an error when the db is starter plan', async function () {
    const hobbyAddon = {
      name: 'postgres-1', plan: {name: 'heroku-postgresql:mini'},
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
        addon: {id: 100, name: 'postgres-1'}, app: {name: 'myapp'}, config_vars: ['HEROKU_POSTGRESQL_PINK_URL'],
      }, {
        addon: {id: 100, name: 'postgres-1'}, app: {name: 'otherapp'}, config_vars: ['HEROKU_POSTGRESQL_PURPLE_URL'], namespace: 'credential:gandalf',
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
      expect(ansis.strip(error.message)).to.equal(err)
    })
  })

  it('only mentions an app with multiple attachments once', async function () {
    const attachments = [
      {
        addon: {id: 100, name: 'postgres-1'}, app: {name: 'myapp'}, config_vars: ['HEROKU_POSTGRESQL_PINK_URL'],
      }, {
        addon: {id: 100, name: 'postgres-1'}, app: {name: 'otherapp'}, config_vars: ['HEROKU_POSTGRESQL_PURPLE_URL'], namespace: 'credential:gandalf',
      }, {
        addon: {id: 100, name: 'postgres-1'}, app: {name: 'otherapp'}, config_vars: ['HEROKU_POSTGRESQL_RED_URL'], namespace: 'credential:gandalf',
      }, {
        addon: {id: 100, name: 'postgres-1'}, app: {name: 'yetanotherapp'}, config_vars: ['HEROKU_POSTGRESQL_BLUE_URL'], namespace: 'credential:gandalf',
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
      expect(ansis.strip(error.message)).to.equal(err)
    })
  })
})
