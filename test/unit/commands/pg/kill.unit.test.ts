import {stdout} from 'stdout-stderr'
import runCommand from '../../../helpers/runCommand.js'
import {expect} from 'chai'
import Cmd from '../../../../src/commands/pg/kill.js'
import * as sinon from 'sinon'
import {pg, utils} from '@heroku/heroku-cli-util'

describe('pg:kill', function () {
  let sandbox: sinon.SinonSandbox
  let getDatabaseStub: sinon.SinonStub
  let execQueryStub: sinon.SinonStub

  const mockDb: pg.ConnectionDetails = {
    database: 'testdb',
    host: 'localhost',
    password: 'testpass',
    pathname: '/testdb',
    port: '5432',
    url: 'postgres://localhost:5432/testdb',
    user: 'testuser',
  }

  beforeEach(function () {
    sandbox = sinon.createSandbox()
    getDatabaseStub = sandbox.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(mockDb)
    execQueryStub = sandbox.stub(utils.pg.PsqlService.prototype, 'execQuery').resolves('')
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('kills pid 100', async function () {
    await runCommand(Cmd, [
      '100',
      '--app',
      'myapp',
    ])

    expect(getDatabaseStub.calledOnce).to.be.true
    expect(execQueryStub.calledOnce).to.be.true
    const query = execQueryStub.getCall(0).args[0]
    expect(query.trim()).to.eq('SELECT pg_cancel_backend(100);')
  })

  it('force kills pid 100', async function () {
    await runCommand(Cmd, [
      '100',
      '--app',
      'myapp',
      '--force',
    ])

    expect(getDatabaseStub.calledOnce).to.be.true
    expect(execQueryStub.calledOnce).to.be.true
    const query = execQueryStub.getCall(0).args[0]
    expect(query.trim()).to.eq('SELECT pg_terminate_backend(100);')
  })

  it('outputs the query result', async function () {
    execQueryStub.resolves('Query result output')

    await runCommand(Cmd, [
      '100',
      '--app',
      'myapp',
    ])

    expect(stdout.output.trim()).to.eq('Query result output')
  })
})
