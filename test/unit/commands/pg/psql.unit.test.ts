import {pg, utils} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import sinon from 'sinon'
import {stderr, stdout} from 'stdout-stderr'

import Cmd from '../../../../src/commands/pg/psql.js'
import runCommand from '../../../helpers/runCommand.js'

const db = {
  attachment: {
    addon: {
      name: 'postgres-1',
    },
    app: {name: 'myapp'},
    config_vars: ['DATABASE_URL'],
  },
  database: 'mydb',
  host: 'localhost',
  password: 'pass',
  pathname: '/corn',
  port: '5432',
  url: 'postgres://jeff:pass@localhost:5432/corn',
  user: 'jeff',
} as unknown as pg.ConnectionDetails

describe('psql', function () {
  beforeEach(function () {
    sinon.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(db)
    sinon.stub(utils.pg.PsqlService.prototype, 'execQuery').resolves('')
    sinon.stub(utils.pg.PsqlService.prototype, 'execFile').resolves('')
  })

  afterEach(function () {
    sinon.restore()
  })

  it('runs psql', async function () {
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--command',
      'SELECT 1',
    ])
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('--> Connecting to ⛁ postgres-1\n')
  })

  it('runs psql with file', async function () {
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--file',
      'test.sql',
    ])
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('--> Connecting to ⛁ postgres-1\n')
  })
})
