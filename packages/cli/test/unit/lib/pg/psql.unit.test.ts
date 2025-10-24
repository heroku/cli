/* eslint-disable max-nested-callbacks */
/*
import {expect} from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as proxyquire from 'proxyquire'
import {stderr} from 'stdout-stderr'
import {ConnectionDetailsWithAttachment, utils} from '@heroku/heroku-cli-util'
import {unwrap} from '../../../helpers/utils/unwrap.js'
import sinon = require('sinon')
import * as tmp from 'tmp'
import type * as Pgsql from '../../../../src/lib/pg/psql.js'


describe('psql', function () {
  const db: ConnectionDetailsWithAttachment = {
    attachment: {} as ConnectionDetailsWithAttachment['attachment'],
    user: 'jeff',
    password: 'pass',
    database: 'mydb',
    port: '5432',
    host: 'localhost',
    pathname: '/mydb',
    bastionHost: '',
    bastionKey: '',
    url: '',
  }

  const bastionDb: ConnectionDetailsWithAttachment = {
    attachment: {} as  ConnectionDetailsWithAttachment['attachment'],
    user: 'jeff',
    password: 'pass',
    database: 'mydb',
    port: '5432',
    pathname: '/mydb',
    bastionHost: 'bastion-host',
    bastionKey: 'super-private-key',
    host: 'localhost',
    url: '',
  }

  const VERSION_OUTPUT = `
  server_version
  -------------------------------
  11.16 (Ubuntu 11.16-1.pgdg20.04+1)
  (1 row)
  `

  let sandbox: sinon.SinonSandbox
  let psql: typeof Pgsql
  let psqlServiceExecQuerySpy: sinon.SinonSpy
  let psqlServiceRunWithTunnelSpy: sinon.SinonSpy
  let queryString = ''
  let env: NodeJS.ProcessEnv

  beforeEach(function () {
    env = process.env
    sandbox = sinon.createSandbox()
    psqlServiceExecQuerySpy = sinon.spy((query: string) => {
      queryString = query
      return Promise.resolve(VERSION_OUTPUT)
    })
    psqlServiceRunWithTunnelSpy = sinon.spy(() => {
      return Promise.resolve()
    })
    const mockUtils = {
      pg: {
        PsqlService: class {
          execQuery = psqlServiceExecQuerySpy
          runWithTunnel = psqlServiceRunWithTunnelSpy
        },
        psql: {
          getPsqlConfigs: sinon.stub().callsFake((db: ConnectionDetailsWithAttachment) => {
            return utils.pg.psql.getPsqlConfigs(db)
          }),
        },
      },
    }
    psql = proxyquire('../../../../src/lib/pg/psql', {
      '@heroku/heroku-cli-util': {
        ConnectionDetailsWithAttachment: {} as ConnectionDetailsWithAttachment,
        utils: mockUtils,
      },
    })
    sandbox.stub(Math, 'random').callsFake(() => 0)
    stderr.start()
  })

  afterEach(async function () {
    queryString = ''
    sandbox.restore()
    stderr.stop()
    process.env = env
  })

  describe('fetchVersion', function () {
    it('gets the server version', async function () {
      const output = await psql.fetchVersion(db)
      expect(output).to.equal('11.16')
      expect(queryString).to.equal('SHOW server_version')
    })
  })

  describe('execFile', function () {
    it('runs psql with file as input', async function () {
      const expectedTunnelConf = {
        dstHost: 'localhost',
        dstPort: 5432,
        host: '',
        localHost: '127.0.0.1',
        localPort: 49152,
        privateKey: '',
        username: 'bastion',
      }
      const expectedEnv = Object.freeze({
        ...process.env,
        PGAPPNAME: 'psql non-interactive',
        PGSSLMODE: 'prefer',
        PGUSER: 'jeff',
        PGPASSWORD: 'pass',
        PGDATABASE: 'mydb',
        PGPORT: '5432',
        PGHOST: 'localhost',
      })
      const options = {
        dbEnv: expectedEnv,
        psqlArgs: ['-f', 'test.sql', '--set', 'sslmode=require'],
        childProcessOptions: {
          stdio: ['ignore', 'pipe', 'inherit'],
        },
      }

      await psql.execFile(db, 'test.sql')
      expect(psqlServiceRunWithTunnelSpy.calledOnce).to.equal(true)
      expect(psqlServiceRunWithTunnelSpy.calledWith(expectedTunnelConf, options)).to.equal(true)
    })

    it('opens an SSH tunnel and runs psql for bastion databases', async function () {
      const expectedTunnelConf = {
        username: 'bastion',
        host: 'bastion-host',
        privateKey: 'super-private-key',
        dstHost: 'localhost',
        dstPort: 5432,
        localHost: '127.0.0.1',
        localPort: 49152,
      }
      const expectedEnv = Object.freeze({
        ...process.env,
        PGAPPNAME: 'psql non-interactive',
        PGSSLMODE: 'prefer',
        PGUSER: 'jeff',
        PGPASSWORD: 'pass',
        PGDATABASE: 'mydb',
        PGPORT: '49152',
        PGHOST: '127.0.0.1',
      })
      const options = {
        dbEnv: expectedEnv,
        psqlArgs: ['-f', 'test.sql', '--set', 'sslmode=require'],
        childProcessOptions: {
          stdio: ['ignore', 'pipe', 'inherit'],
        },
      }

      await psql.execFile(bastionDb, 'test.sql')
      expect(psqlServiceRunWithTunnelSpy.calledOnce).to.equal(true)
      expect(psqlServiceRunWithTunnelSpy.calledWith(expectedTunnelConf, options)).to.equal(true)
    })
  })

  describe('psqlInteractive', function () {
    const db = {
      attachment: {
        app: {
          name: 'sleepy-hollow-9876',
        },
        name: 'DATABASE',
      },
    } as ConnectionDetailsWithAttachment

    context('when HEROKU_PSQL_HISTORY is set', function () {
      let historyPath: string

      function mockHerokuPSQLHistory(path: string) {
        process.env.HEROKU_PSQL_HISTORY = path
      }

      before(function () {
        tmp.setGracefulCleanup()
      })

      context('when HEROKU_PSQL_HISTORY is a valid directory path', function () {
        beforeEach(function () {
          historyPath = tmp.dirSync().name
          mockHerokuPSQLHistory(historyPath)
        })

        afterEach(function () {
          fs.rmdirSync(historyPath)
        })

        it('is the directory path to per-app history files', async function () {
          const expectedArgs = [
            '--set',
            'PROMPT1=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            'PROMPT2=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            `HISTFILE=${historyPath}/sleepy-hollow-9876`,
            '--set',
            'sslmode=require',
          ]
          const expectedEnv = Object.freeze({
            ...process.env,
            PGAPPNAME: 'psql interactive',
            PGSSLMODE: 'prefer',
            HEROKU_PSQL_HISTORY: historyPath,
          })

          const options = {
            dbEnv: expectedEnv,
            psqlArgs: expectedArgs,
            childProcessOptions: {
              stdio: 'inherit',
            },
          }

          await psql.interactive(db)
          expect(psqlServiceRunWithTunnelSpy.calledOnce).to.equal(true)
          expect(psqlServiceRunWithTunnelSpy.calledWith(sinon.match.any, options)).to.equal(true)
        })
      })

      context('when HEROKU_PSQL_HISTORY is a valid file path', function () {
        beforeEach(function () {
          historyPath = tmp.fileSync().name
          mockHerokuPSQLHistory(historyPath)
        })

        afterEach(function () {
          fs.unlinkSync(historyPath)
        })

        it('is the path to the history file', async function () {
          const expectedEnv = Object.freeze({
            ...process.env,
            PGAPPNAME: 'psql interactive',
            PGSSLMODE: 'prefer',
            HEROKU_PSQL_HISTORY: historyPath,
          })
          const expectedArgs = [
            '--set',
            'PROMPT1=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            'PROMPT2=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            `HISTFILE=${process.env.HEROKU_PSQL_HISTORY}`,
            '--set',
            'sslmode=require',
          ]

          const options = {
            dbEnv: expectedEnv,
            psqlArgs: expectedArgs,
            childProcessOptions: {
              stdio: 'inherit',
            },
          }

          await psql.interactive(db)
          expect(psqlServiceRunWithTunnelSpy.calledOnce).to.equal(true)
          expect(psqlServiceRunWithTunnelSpy.calledWith(sinon.match.any, options)).to.equal(true)
        })
      })

      context('when HEROKU_PSQL_HISTORY is an invalid path', function () {
        it('issues a warning', async function () {
          const invalidPath = path.join('/', 'path', 'to', 'history')
          mockHerokuPSQLHistory(invalidPath)
          const expectedMessage = `Warning: HEROKU_PSQL_HISTORY is set but is not a valid path (${invalidPath})\n`
          const expectedEnv = Object.freeze({
            ...process.env,
            PGAPPNAME: 'psql interactive',
            PGSSLMODE: 'prefer',
            HEROKU_PSQL_HISTORY: invalidPath,
          })
          const expectedArgs = [
            '--set',
            'PROMPT1=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            'PROMPT2=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            'sslmode=require',
          ]
          const options = {
            dbEnv: expectedEnv,
            psqlArgs: expectedArgs,
            childProcessOptions: {
              stdio: 'inherit',
            },
          }

          await psql.interactive(db)
          expect(psqlServiceRunWithTunnelSpy.calledOnce).to.equal(true)
          expect(psqlServiceRunWithTunnelSpy.calledWith(sinon.match.any, options)).to.equal(true)
          expect(unwrap(stderr.output)).to.equal(expectedMessage)
        })
      })
    })
  })
})

*/
