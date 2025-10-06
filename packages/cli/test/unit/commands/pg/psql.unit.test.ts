import {stdout, stderr} from 'stdout-stderr'
import {expect} from 'chai'
import * as sinon from 'sinon'
import * as proxyquire from 'proxyquire'
import runCommand, {GenericCmd} from '../../../helpers/runCommand'

const db = {
  user: 'jeff', password: 'pass', database: 'mydb', port: 5432, host: 'localhost', attachment: {
    addon: {
      name: 'postgres-1',
    }, config_vars: ['DATABASE_URL'], app: {name: 'myapp'},
  },
}

describe('psql', function () {
  let databaseResolverStub: sinon.SinonStub
  let psqlServiceExecQueryStub: sinon.SinonStub
  let Cmd: GenericCmd
  const psql = {
    fetchVersion: () => {
      return Promise.resolve('')
    },
    execFile: () => {
      return Promise.resolve('')
    },
  }

  beforeEach(function () {
    databaseResolverStub = sinon.stub().resolves(db)
    psqlServiceExecQueryStub = sinon.stub().resolves('')

    // Mock the utils.pg classes
    const mockUtils = {
      pg: {
        DatabaseResolver: class {
          getDatabase = databaseResolverStub
        },
        PsqlService: class {
          execQuery = psqlServiceExecQueryStub
        },
      },
    }

    Cmd = proxyquire('../../../../src/commands/pg/psql', {
      '../../lib/pg/psql': psql,
      '@heroku/heroku-cli-util': {
        utils: mockUtils,
      },
    }).default
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
    expect(stderr.output).to.equal('--> Connecting to postgres-1\n')
  })

  it('runs psql with file', async function () {
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--file',
      'test.sql',
    ])
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('--> Connecting to postgres-1\n')
  })
})
