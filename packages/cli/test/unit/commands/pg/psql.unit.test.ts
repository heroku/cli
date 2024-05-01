import {stdout, stderr} from 'stdout-stderr'
import {expect} from 'chai'
import * as sinon from 'sinon'
import * as proxyquire from 'proxyquire'
import runCommand from '../../../helpers/runCommand'
import * as psql from '../../../../src/lib/pg/psql'

const db = {
  user: 'jeff', password: 'pass', database: 'mydb', port: 5432, host: 'localhost', attachment: {
    addon: {
      name: 'postgres-1',
    }, config_vars: ['DATABASE_URL'], app: {name: 'myapp'},
  },
}

const fetcher = {
  database: () => db,
}
const {default: Cmd} = proxyquire('../../../../src/commands/pg/psql', {
  '../../lib/pg/fetcher': fetcher,
})
describe('psql', function () {
  let stub: sinon.SinonStub

  afterEach(function () {
    stub.restore()
  })

  it('runs psql', async function () {
    stub = sinon.stub(psql, 'exec').returns(Promise.resolve(''))

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
    stub = sinon.stub(psql, 'execFile').returns(Promise.resolve(''))
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
