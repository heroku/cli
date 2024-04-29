import {stdout, stderr} from 'stdout-stderr'
import runCommand from '../../../../helpers/runCommand'
import {expect} from 'chai'
import nock = require('nock')
import Cmd from '../../../../../src/commands/pg/credentials/create'

describe('pg:credentials:create', function () {
  let api: nock.Scope
  let pg: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    pg = nock('https://api.data.heroku.com')
  })

  afterEach(function () {
    nock.cleanAll()
    api.done()
  })

  it('creates the credential', async function () {
    const addon = {
      name: 'postgres-1', plan: {name: 'heroku-postgresql:standard-0'},
    }
    api.post('/actions/addon-attachments/resolve', {
      app: 'myapp',
      addon_attachment: 'DATABASE_URL',
      addon_service: 'heroku-postgresql',
    }).reply(200, [{addon}])

    pg.post('/postgres/v0/databases/postgres-1/credentials')
      .reply(200)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--name',
      'credname',
    ])
    expect(stdout.output).to.equal('\nPlease attach the credential to the apps you want to use it in by running heroku addons:attach postgres-1 --credential credname -a myapp.\nPlease define the new grants for the credential within Postgres: heroku pg:psql postgres-1 -a myapp.\n')
    return expect(stderr.output).to.equal('Creating credential credname...\nCreating credential credname... done\n')
  })

  it('throws an error when the db is numbered essential plan', function () {
    const essentialAddon = {
      name: 'postgres-1', plan: {name: 'heroku-postgresql:essential-0'},
    }

    api.post('/actions/addon-attachments/resolve', {
      app: 'myapp',
      addon_attachment: 'DATABASE_URL',
      addon_service: 'heroku-postgresql',
    }).reply(200, [{addon: essentialAddon}])

    const err = "You can't create a custom credential on Essential-tier databases."
    return expect(runCommand(Cmd, [
      '--app',
      'myapp',
      '--name',
      'jeff',
    ])).to.be.rejectedWith(Error, err)
  })

  it('throws an error when the db is essential plan', function () {
    const hobbyAddon = {
      name: 'postgres-1', plan: {name: 'heroku-postgresql:mini'},
    }
    api.post('/actions/addon-attachments/resolve', {
      app: 'myapp',
      addon_attachment: 'DATABASE_URL',
      addon_service: 'heroku-postgresql',
    }).reply(200, [{addon: hobbyAddon}])

    const err = "You can't create a custom credential on Essential-tier databases."
    return expect(runCommand(Cmd, [
      '--app',
      'myapp',
      '--name',
      'jeff',
    ])).to.be.rejectedWith(Error, err)
  })
})
