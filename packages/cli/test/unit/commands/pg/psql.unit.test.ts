import {stdout, stderr} from 'stdout-stderr'
import {expect} from 'chai'
import * as sinon from 'sinon'
import {pg, utils} from '@heroku/heroku-cli-util'
import Cmd from '../../../../src/commands/pg/psql.js'
import runCommand from '../../../helpers/runCommand.js'

const db = {
  user: 'jeff',
  host: 'localhost',
  password: 'pass',
  pathname: '/babyface',
  database: 'mydb',
  url: 'postgres://jeff:pass@localhost:5432/babyface',
  port: '5432',
  attachment: {
    addon: {
      name: 'postgres-1',
    },
    config_vars: ['DATABASE_URL'],
    app: {name: 'myapp'},
  },
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
