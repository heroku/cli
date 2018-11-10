'use strict'

/* global describe it beforeEach afterEach context */

const sinon = require('sinon')
const expect = require('unexpected')
const unwrap = require('../unwrap')
const path = require('path')
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

const proxyquire = require('proxyquire')
var tunnelStub = sinon.stub().callsArg(1)

const bastion = proxyquire('../../lib/bastion', {
  'tunnel-ssh': tunnelStub
})
const psql = proxyquire('../../lib/psql', {
  './bastion': bastion
})

describe('psql', () => {
  beforeEach(() => {
    sinon.stub(Math, 'random', function () {
      return 0
    })
  })

  afterEach(() => {
    Math.random.restore()
    tunnelStub.reset()
  })

  describe('exec', () => {
    it('runs psql', sinon.test(() => {
      let cp = sinon.mock(require('child_process'))
      let env = Object.assign({}, process.env, {
        PGAPPNAME: 'psql non-interactive',
        PGSSLMODE: 'prefer',
        PGUSER: 'jeff',
        PGPASSWORD: 'pass',
        PGDATABASE: 'mydb',
        PGPORT: 5432,
        PGHOST: 'localhost'
      })
      let opts = { env: env, encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'inherit' ] }
      cp.expects('spawn').withExactArgs('psql', ['-c', 'SELECT NOW();'], opts).once().returns(
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
      return psql.exec(db, 'SELECT NOW();')
        .then(() => cp.verify())
        .then(() => cp.restore())
    }))
    it('opens an SSH tunnel and runs psql for bastion databases', sinon.test(() => {
      let cp = sinon.mock(require('child_process'))
      let tunnelConf = {
        username: 'bastion',
        host: 'bastion-host',
        privateKey: 'super-private-key',
        dstHost: 'localhost',
        dstPort: 5432,
        localHost: '127.0.0.1',
        localPort: 49152
      }
      cp.expects('spawn').withArgs('psql', ['-c', 'SELECT NOW();']).once().returns(
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
    }))
  })

  describe('execFile', () => {
    it('runs psql', sinon.test(() => {
      let cp = sinon.mock(require('child_process'))
      let env = Object.assign({}, process.env, {
        PGAPPNAME: 'psql non-interactive',
        PGSSLMODE: 'prefer',
        PGUSER: 'jeff',
        PGPASSWORD: 'pass',
        PGDATABASE: 'mydb',
        PGPORT: 5432,
        PGHOST: 'localhost'
      })
      let opts = { env: env, encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'inherit' ] }
      cp.expects('spawn').withExactArgs('psql', ['-f', 'test.sql'], opts).once().returns(
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
      return psql.execFile(db, 'test.sql')
        .then(() => cp.verify())
        .then(() => cp.restore())
    }))
    it('opens an SSH tunnel and runs psql for bastion databases', sinon.test(() => {
      let cp = sinon.mock(require('child_process'))
      let tunnelConf = {
        username: 'bastion',
        host: 'bastion-host',
        privateKey: 'super-private-key',
        dstHost: 'localhost',
        dstPort: 5432,
        localHost: '127.0.0.1',
        localPort: 49152
      }
      cp.expects('spawn').withArgs('psql', ['-f', 'test.sql']).once().returns(
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
    }))
  })

  describe('psqlInteractive', () => {
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
        it('is the directory path to per-app history files', sinon.test(() => {
          const env = Object.assign({}, process.env, {
            PGAPPNAME: 'psql interactive',
            PGSSLMODE: 'prefer'
          })

          const opts = { env: env, stdio: 'inherit' }
          const cpMock = sinon.mock(require('child_process'))
          const existsSyncStub = sinon.stub(require('fs'), 'existsSync', () => {
            return true
          })

          const statSyncStub = sinon.stub(require('fs'), 'statSync', () => {
            return {
              isDirectory: () => true
            }
          })

          const args = [
            '--set',
            'PROMPT1=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            'PROMPT2=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            `HISTFILE=${process.env.HEROKU_PSQL_HISTORY}/sleepy-hollow-9876`
          ]

          cpMock.expects('spawn').withExactArgs('psql', args, opts).once().returns(
            {
              on: (key, callback) => {
                if (key === 'close') {
                  callback(new Error(0))
                }
              }
            }
          )

          return psql.interactive(db)
            .then(() => cpMock.verify())
            .finally(() => {
              cpMock.restore()
              existsSyncStub.restore()
              statSyncStub.restore()
            })
        }))
      })

      context('when HEROKU_PSQL_HISTORY is a valid file path', () => {
        it('is the path to the history file', sinon.test(() => {
          const env = Object.assign({}, process.env, {
            PGAPPNAME: 'psql interactive',
            PGSSLMODE: 'prefer'
          })

          const opts = { env: env, stdio: 'inherit' }
          const cpMock = sinon.mock(require('child_process'))
          const existsSyncStub = sinon.stub(require('fs'), 'existsSync', () => {
            return true
          })

          const statSyncStub = sinon.stub(require('fs'), 'statSync', () => {
            return {
              isDirectory: () => false
            }
          })

          const args = [
            '--set',
            'PROMPT1=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            'PROMPT2=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            `HISTFILE=${process.env.HEROKU_PSQL_HISTORY}`
          ]

          cpMock.expects('spawn').withExactArgs('psql', args, opts).once().returns(
            {
              on: (key, callback) => {
                if (key === 'close') {
                  callback(new Error(0))
                }
              }
            }
          )

          return psql.interactive(db)
            .then(() => cpMock.verify())
            .finally(() => {
              cpMock.restore()
              existsSyncStub.restore()
              statSyncStub.restore()
            })
        }))
      })

      context('when HEROKU_PSQL_HISTORY is an invalid path', () => {
        it('issues a warning', sinon.test(() => {
          const cli = require('heroku-cli-util')
          cli.mockConsole()
          const env = Object.assign({}, process.env, {
            PGAPPNAME: 'psql interactive',
            PGSSLMODE: 'prefer'
          })

          const opts = { env: env, stdio: 'inherit' }
          const cpMock = sinon.mock(require('child_process'))
          const existsSyncStub = sinon.stub(require('fs'), 'existsSync', () => {
            return false
          })

          const args = [
            '--set',
            'PROMPT1=sleepy-hollow-9876::DATABASE%R%# ',
            '--set',
            'PROMPT2=sleepy-hollow-9876::DATABASE%R%# '
          ]

          cpMock.expects('spawn').withExactArgs('psql', args, opts).once().returns(
            {
              on: (key, callback) => {
                if (key === 'close') {
                  callback(new Error(0))
                }
              }
            }
          )

          return psql.interactive(db)
            .then(() => cpMock.verify())
            .then(() => expect(unwrap(cli.stderr), 'to equal', `HEROKU_PSQL_HISTORY is set but is not a valid path (${path.join('/', 'path', 'to', 'history')})\n`))
            .finally(() => {
              cpMock.restore()
              existsSyncStub.restore()
            })
        }))
      })
    })
  })
})
