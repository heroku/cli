'use strict'

/* global describe it beforeEach afterEach context */

const sinon = require('sinon')
const expect = require('unexpected')
const unwrap = require('../unwrap')
const path = require('path')
const proxyquire = require('proxyquire')

const db = {
  user: 'jeff',
  password: 'pass',
  database: 'mydb',
  port: 5432,
  host: 'localhost',
  hostname: 'localhost'
}

const bastionDb = {
  user: 'jeff',
  password: 'pass',
  database: 'mydb',
  port: 5432,
  bastionHost: 'bastion-host',
  bastionKey: 'super-private-key',
  host: 'localhost',
  hostname: 'localhost'
}

describe('psql', () => {
  beforeEach(() => {
    sinon.stub(Math, 'random').callsFake(() => 0)
  })

  afterEach(() => {
    Math.random.restore()
  })

  describe('exec', () => {
    let sandbox
    let tunnelStub
    let bastion
    let psql

    beforeEach(() => {
      sandbox = sinon.createSandbox()
      tunnelStub = sandbox.stub().callsArg(1)
      bastion = proxyquire('../../lib/bastion', {
        'tunnel-ssh': tunnelStub
      })
      psql = proxyquire('../../lib/psql', {
        './bastion': bastion
      })
    })

    afterEach(() => {
      sandbox.restore()
    })

    it('runs psql', () => {
      const spawnStub = sandbox.stub(require('child_process'), 'spawn')
      const expectedEnv = Object.freeze({
        PGAPPNAME: 'psql non-interactive',
        PGSSLMODE: 'prefer',
        PGUSER: 'jeff',
        PGPASSWORD: 'pass',
        PGDATABASE: 'mydb',
        PGPORT: 5432,
        PGHOST: 'localhost'
      })

      spawnStub.callsFake((commandName, args, opts) => {
        expect(commandName, 'to equal', 'psql')
        expect(args, 'to equal', ['-c', 'SELECT NOW();', '--set', 'sslmode=require'])
        expect(opts.stdio, 'to equal', ['ignore', 'pipe', 'inherit'])
        expect(opts.encoding, 'to equal', 'utf8')
        Object.entries(expectedEnv).forEach(([key, expectedValue]) => {
          expect(opts.env[key], 'to equal', expectedValue)
        })

        return {
          stdout: {
            on: (key, callback) => {
              if (key === 'data') {
                callback(new Error('2001-01-01T00:00:00.000UTC'))
              }
            }
          },
          on: (key, callback) => {
            if (key === 'close') {
              callback(new Error(0))
            } else if (key === 'error') {
              callback(null)
            }
          }
        }
      })

      return psql
        .exec(db, 'SELECT NOW();')
        .then(() => spawnStub.restore())
    })
    it('opens an SSH tunnel and runs psql for bastion databases', () => {
      let cp = sandbox.mock(require('child_process'))
      let tunnelConf = {
        username: 'bastion',
        host: 'bastion-host',
        privateKey: 'super-private-key',
        dstHost: 'localhost',
        dstPort: 5432,
        localHost: '127.0.0.1',
        localPort: 49152
      }
      cp.expects('spawn').withArgs('psql', ['-c', 'SELECT NOW();', '--set', 'sslmode=require']).once().returns(
        {
          stdout: {
            on: (key, callback) => {
              if (key === 'data') {
                callback(new Error('2001-01-01T00:00:00.000UTC'))
              }
            }
          },
          on: (key, callback) => {
            if (key === 'close') {
              callback(new Error(0))
            } else if (key === 'error') {
              callback(null)
            }
          }
        }
      )
      return psql.exec(bastionDb, 'SELECT NOW();', 1000)
        .then(() => expect(
          tunnelStub.withArgs(tunnelConf).calledOnce, 'to equal', true))
        .then(() => cp.verify())
        .then(() => cp.restore())
    })
  })

  describe('execFile', () => {
    let sandbox
    let tunnelStub
    let bastion
    let psql

    beforeEach(() => {
      sandbox = sinon.createSandbox()
      tunnelStub = sandbox.stub().callsArg(1)
      bastion = proxyquire('../../lib/bastion', {
        'tunnel-ssh': tunnelStub
      })
      psql = proxyquire('../../lib/psql', {
        './bastion': bastion
      })
    })

    afterEach(() => {
      sandbox.restore()
    })

    it('runs psql', () => {
      const spawnStub = sandbox.stub(require('child_process'), 'spawn')
      const expectedEnv = Object.freeze({
        PGAPPNAME: 'psql non-interactive',
        PGSSLMODE: 'prefer',
        PGUSER: 'jeff',
        PGPASSWORD: 'pass',
        PGDATABASE: 'mydb',
        PGPORT: 5432,
        PGHOST: 'localhost'
      })

      spawnStub.callsFake((commandName, args, opts) => {
        expect(commandName, 'to equal', 'psql')
        expect(args, 'to equal', ['-f', 'test.sql', '--set', 'sslmode=require'])
        expect(opts.stdio, 'to equal', ['ignore', 'pipe', 'inherit'])
        expect(opts.encoding, 'to equal', 'utf8')
        Object.entries(expectedEnv).forEach(([key, expectedValue]) => {
          expect(opts.env[key], 'to equal', expectedValue)
        })

        return {
          stdout: {
            on: (key, callback) => {
              if (key === 'data') {
                callback(new Error('2001-01-01T00:00:00.000UTC'))
              }
            }
          },
          on: (key, callback) => {
            if (key === 'close') {
              callback(new Error(0))
            } else if (key === 'error') {
              callback(null)
            }
          }
        }
      })

      return psql
        .execFile(db, 'test.sql')
        .then(() => spawnStub.restore())
    })
    it('opens an SSH tunnel and runs psql for bastion databases', () => {
      let cp = sandbox.mock(require('child_process'))
      let tunnelConf = {
        username: 'bastion',
        host: 'bastion-host',
        privateKey: 'super-private-key',
        dstHost: 'localhost',
        dstPort: 5432,
        localHost: '127.0.0.1',
        localPort: 49152
      }
      cp.expects('spawn').withArgs('psql', ['-f', 'test.sql', '--set', 'sslmode=require']).once().returns(
        {
          stdout: {
            on: (key, callback) => {
              if (key === 'data') {
                callback(new Error('2001-01-01T00:00:00.000UTC'))
              }
            }
          },
          on: (key, callback) => {
            if (key === 'close') {
              callback(new Error(0))
            } else if (key === 'error') {
              callback(null)
            }
          }
        }
      )
      return psql.execFile(bastionDb, 'test.sql', 1000)
        .then(() => expect(
          tunnelStub.withArgs(tunnelConf).calledOnce, 'to equal', true))
        .then(() => cp.verify())
        .then(() => cp.restore())
    })
  })

  describe('psqlInteractive', () => {
    const psql = proxyquire('../../lib/psql', {})
    const db = {
      attachment: {
        app: {
          name: 'sleepy-hollow-9876'
        },
        name: 'DATABASE'
      }
    }

    context('when HEROKU_PSQL_HISTORY is set', () => {
      beforeEach(() => {
        process.env.HEROKU_PSQL_HISTORY = `${path.join('/', 'path', 'to', 'history')}`
      })
      afterEach(() => {
        delete process.env.HEROKU_PSQL_HISTORY
      })

      context('when HEROKU_PSQL_HISTORY is a valid directory path', () => {
        it('is the directory path to per-app history files', () => {
          const spawnStub = sinon.stub(require('child_process'), 'spawn')

          const existsSyncStub = sinon
            .stub(require('fs'), 'existsSync')
            .callsFake(() => true)

          const statSyncStub = sinon
            .stub(require('fs'), 'statSync')
            .returns({ isDirectory: () => true })

          const expectedArgs = [
            '--set',
            'PROMPT1=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            'PROMPT2=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            `HISTFILE=${process.env.HEROKU_PSQL_HISTORY}/sleepy-hollow-9876`,
            '--set',
            'sslmode=require'
          ]

          const expectedEnv = Object.freeze({
            PGAPPNAME: 'psql interactive',
            PGSSLMODE: 'prefer'
          })

          spawnStub.callsFake((commandName, args, opts) => {
            expect(commandName, 'to equal', 'psql')
            expect(args, 'to equal', expectedArgs)
            expect(opts.stdio, 'to equal', 'inherit')
            Object.entries(expectedEnv).forEach(([key, expectedValue]) => {
              expect(opts.env[key], 'to equal', expectedValue)
            })

            return {
              on: (key, callback) => {
                if (key === 'close') {
                  callback(new Error(0))
                }
              }
            }
          })

          return psql.interactive(db)
            .finally(() => {
              spawnStub.restore()
              existsSyncStub.restore()
              statSyncStub.restore()
            })
        })
      })

      context('when HEROKU_PSQL_HISTORY is a valid file path', () => {
        it('is the path to the history file', () => {
          const spawnStub = sinon.stub(require('child_process'), 'spawn')

          const existsSyncStub = sinon
            .stub(require('fs'), 'existsSync')
            .callsFake(() => true)

          const statSyncStub = sinon
            .stub(require('fs'), 'statSync')
            .returns({ isDirectory: () => false })

          const expectedEnv = Object.freeze({
            PGAPPNAME: 'psql interactive',
            PGSSLMODE: 'prefer'
          })

          const expectedArgs = [
            '--set',
            'PROMPT1=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            'PROMPT2=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            `HISTFILE=${process.env.HEROKU_PSQL_HISTORY}`,
            '--set',
            'sslmode=require'
          ]

          spawnStub.callsFake((commandName, args, opts) => {
            expect(commandName, 'to equal', 'psql')
            expect(args, 'to equal', expectedArgs)
            expect(opts.stdio, 'to equal', 'inherit')
            Object.entries(expectedEnv).forEach(([key, expectedValue]) => {
              expect(opts.env[key], 'to equal', expectedValue)
            })

            return {
              on: (key, callback) => {
                if (key === 'close') {
                  callback(new Error(0))
                }
              }
            }
          })

          return psql.interactive(db)
            .finally(() => {
              spawnStub.restore()
              existsSyncStub.restore()
              statSyncStub.restore()
            })
        })
      })

      context('when HEROKU_PSQL_HISTORY is an invalid path', () => {
        it('issues a warning', () => {
          const cli = require('heroku-cli-util')
          cli.mockConsole()

          const expectedEnv = Object.freeze({
            PGAPPNAME: 'psql interactive',
            PGSSLMODE: 'prefer'
          })

          const spawnStub = sinon.stub(require('child_process'), 'spawn')
          const existsSyncStub = sinon.stub(require('fs'), 'existsSync').callsFake(() => false)

          const expectedArgs = [
            '--set',
            'PROMPT1=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            'PROMPT2=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            'sslmode=require'
          ]

          spawnStub.callsFake((commandName, args, opts) => {
            expect(commandName, 'to equal', 'psql')
            expect(args, 'to equal', expectedArgs)
            expect(opts.stdio, 'to equal', 'inherit')
            Object.entries(expectedEnv).forEach(([key, expectedValue]) => {
              expect(opts.env[key], 'to equal', expectedValue)
            })
            return {
              on: (key, callback) => {
                if (key === 'close') {
                  callback(new Error(0))
                }
              }
            }
          })

          return psql.interactive(db)
            .then(() => {
              const expectedPath = path.join('/', 'path', 'to', 'history')
              const expectedMessage = `HEROKU_PSQL_HISTORY is set but is not a valid path (${expectedPath})\n`

              expect(unwrap(cli.stderr), 'to equal', expectedMessage)
            })
            .finally(() => {
              spawnStub.restore()
              existsSyncStub.restore()
            })
        })
      })
    })
  })
})
