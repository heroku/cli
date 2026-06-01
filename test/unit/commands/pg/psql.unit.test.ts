import {runCommand} from '@heroku-cli/test-utils'
import {pg, utils} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import {restore, stub} from 'sinon'

import Cmd from '../../../../src/commands/pg/psql.js'

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
    stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(db)
    stub(utils.pg.PsqlService.prototype, 'execQuery').resolves('')
    stub(utils.pg.PsqlService.prototype, 'execFile').resolves('')
  })

  afterEach(function () {
    restore()
  })

  it('runs psql', async function () {
    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--command',
      'SELECT 1',
    ])
    expect(stdout).to.equal('')
    expect(stderr).to.equal('--> Connecting to ⛁ postgres-1\n')
  })

  it('runs psql with file', async function () {
    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--file',
      'test.sql',
    ])
    expect(stdout).to.equal('')
    expect(stderr).to.equal('--> Connecting to ⛁ postgres-1\n')
  })
})
