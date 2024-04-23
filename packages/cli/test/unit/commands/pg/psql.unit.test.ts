import {stdout, stderr} from 'stdout-stderr'
import {expect} from 'chai'
import * as nock from 'nock'
import * as sinon from 'sinon'
import * as fetcher from '../../../../src/lib/pg/fetcher'
const proxyquire = require('proxyquire')
import runCommand from '../../../helpers/runCommand'

const db = {
  user: 'jeff', password: 'pass', database: 'mydb', port: 5432, host: 'localhost', attachment: {
    addon: {
      name: 'postgres-1',
    }, config_vars: ['DATABASE_URL'], app: {name: 'myapp'},
  },
}

const fetcher = () => ({
  database: () => db,
})
const cmd = proxyquire('../../../commands/psql', {
  '../lib/fetcher': fetcher,
})[0]
describe('psql', () => {
  it('runs psql', () => {
    let psql = require('../../../lib/psql')
    sinon.stub(psql, 'exec')
      .returns(Promise.resolve(''))
    return runCommand(Cmd, [
      '--command',
      'SELECT 1',
    ])
      .then(() => expect(stdout.output).to.equal(''))
      .then(() => expect(stderr.output).to.equal('--> Connecting to postgres-1\n'))
      .then(() => psql.exec.restore())
  })
  it('runs psql with file', () => {
    let psql = require('../../../lib/psql')
    sinon.stub(psql, 'execFile')
      .returns(Promise.resolve(''))
    return runCommand(Cmd, [
      '--file',
      'test.sql',
    ])
      .then(() => expect(stdout.output).to.equal(''))
      .then(() => expect(stderr.output).to.equal('--> Connecting to postgres-1\n'))
      .then(() => psql.execFile.restore())
  })
})
