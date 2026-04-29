import {runCommand} from '@heroku-cli/test-utils'
import {pg, utils} from '@heroku/heroku-cli-util'
import {CLIError} from '@oclif/core/errors'
import {expect} from 'chai'
import {restore, SinonSpy, stub} from 'sinon'

import type {DynoOpts} from '../../../../../src/lib/run/dyno.js'

import DataPgPsql from '../../../../../src/commands/data/pg/psql.js'

describe('data:pg:psql', function () {
  let psqlServiceExecQueryStub: SinonSpy
  let psqlServiceExecFileStub: SinonSpy
  let psqlServiceInteractiveStub: SinonSpy
  let runThroughOneOffDynoSpy: SinonSpy

  afterEach(function () {
    restore()
  })

  describe('non-advanced tiers', function () {
    beforeEach(function () {
      stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(db)
      psqlServiceExecQueryStub = stub(utils.pg.PsqlService.prototype, 'execQuery').resolves('')
      psqlServiceExecFileStub = stub(utils.pg.PsqlService.prototype, 'execFile').resolves('')
      psqlServiceInteractiveStub = stub(utils.pg.PsqlService.prototype, 'interactiveSession').resolves('')
    })

    const db = {
      attachment: {
        addon: {
          name: 'postgres-1',
          plan: {
            name: 'heroku-postgresql:essential-1',
          },
        }, app: {name: 'myapp'}, config_vars: ['DATABASE_URL'],
        name: 'DATABASE',
      }, database: 'mydb', host: 'localhost', password: 'pass', port: 5432, user: 'jeff',
    } as unknown as pg.ConnectionDetails

    it('runs psql', async function () {
      const {stderr, stdout} = await runCommand(DataPgPsql, [
        'DATABASE',
        '--app',
        'myapp',
        '--command',
        'SELECT 1',
      ])

      expect(stdout).to.equal('')
      expect(stderr).to.equal('--> Connecting to postgres-1\n')
    })

    it('passes cmdArgs to execQuery with --command', async function () {
      await runCommand(DataPgPsql, [
        'DATABASE',
        '--app',
        'myapp',
        '--command',
        'SELECT 1',
      ])

      expect(psqlServiceExecQueryStub.calledOnce).to.be.true
      expect(psqlServiceExecQueryStub.args[0][0]).to.equal('SELECT 1')
      expect(psqlServiceExecQueryStub.args[0][1]).to.deep.equal([
        '--set',
        'channel_binding=require',
      ])
    })

    it('runs psql with file', async function () {
      const {stderr, stdout} = await runCommand(DataPgPsql, [
        'DATABASE',
        '--app',
        'myapp',
        '--file',
        'test.sql',
      ])

      expect(stdout).to.equal('')
      expect(stderr).to.equal('--> Connecting to postgres-1\n')
    })

    it('passes cmdArgs to execFile with --file', async function () {
      await runCommand(DataPgPsql, [
        'DATABASE',
        '--app',
        'myapp',
        '--file',
        'test.sql',
      ])

      expect(psqlServiceExecFileStub.calledOnce).to.be.true
      expect(psqlServiceExecFileStub.args[0][0]).to.equal('test.sql')
      expect(psqlServiceExecFileStub.args[0][1]).to.deep.equal([
        '--set',
        'channel_binding=require',
      ])
    })

    it('passes cmdArgs to interactiveSession when running interactively', async function () {
      await runCommand(DataPgPsql, [
        'DATABASE',
        '--app',
        'myapp',
      ])

      expect(psqlServiceInteractiveStub.calledOnce).to.be.true
      expect(psqlServiceInteractiveStub.args[0][0]).to.deep.equal([
        '--set',
        'channel_binding=require',
      ])
    })

    it('passes cmdArgs with custom channel_binding when --channel-binding is set', async function () {
      await runCommand(DataPgPsql, [
        'DATABASE',
        '--app',
        'myapp',
        '--command',
        'SELECT 1',
        '--channel-binding',
        'disable',
      ])

      expect(psqlServiceExecQueryStub.calledOnce).to.be.true
      expect(psqlServiceExecQueryStub.args[0][1]).to.deep.equal([
        '--set',
        'channel_binding=disable',
      ])
    })
  })

  describe('advanced tier (publicly networked)', function () {
    beforeEach(function () {
      stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(db)
      psqlServiceExecQueryStub = stub(utils.pg.PsqlService.prototype, 'execQuery').resolves('')
      psqlServiceExecFileStub = stub(utils.pg.PsqlService.prototype, 'execFile').resolves('')
      psqlServiceInteractiveStub = stub(utils.pg.PsqlService.prototype, 'interactiveSession').resolves('')
    })

    const db = {
      attachment: {
        addon: {
          name: 'postgres-1',
          plan: {
            name: 'heroku-postgresql:advanced',
          },
        },
        app: {name: 'myapp'}, config_vars: [
          'DATABASE_URL',
          'DATABASE_ANALYTICS_URL',
        ],
      }, database: 'mydb', host: 'localhost', name: 'DATABASE', password: 'pass', port: 5432,
      user: 'jeff',
    } as unknown as pg.ConnectionDetails

    it('passes cmdArgs to execQuery with --command for advanced tier', async function () {
      await runCommand(DataPgPsql, [
        'DATABASE',
        '--app',
        'myapp',
        '--command',
        'SELECT 1',
      ])

      expect(psqlServiceExecQueryStub.calledOnce).to.be.true
      expect(psqlServiceExecQueryStub.args[0][0]).to.equal('SELECT 1')
      expect(psqlServiceExecQueryStub.args[0][1]).to.deep.equal([
        '--set',
        'channel_binding=require',
      ])
    })

    it('runs psql with file', async function () {
      const {stderr, stdout} = await runCommand(DataPgPsql, [
        'DATABASE',
        '--app',
        'myapp',
        '--file',
        'test.sql',
      ])

      expect(stdout).to.equal('')
      expect(stderr).to.equal('--> Connecting to postgres-1\n')
    })

    it('passes cmdArgs to execFile with --file for advanced tier', async function () {
      await runCommand(DataPgPsql, [
        'DATABASE',
        '--app',
        'myapp',
        '--file',
        'test.sql',
      ])

      expect(psqlServiceExecFileStub.calledOnce).to.be.true
      expect(psqlServiceExecFileStub.args[0][0]).to.equal('test.sql')
      expect(psqlServiceExecFileStub.args[0][1]).to.deep.equal([
        '--set',
        'channel_binding=require',
      ])
    })

    it('passes cmdArgs with custom channel_binding when --channel-binding is set for advanced tier', async function () {
      await runCommand(DataPgPsql, [
        'DATABASE',
        '--app',
        'myapp',
        '--command',
        'SELECT 1',
        '--channel-binding',
        'disable',
      ])

      expect(psqlServiceExecQueryStub.calledOnce).to.be.true
      expect(psqlServiceExecQueryStub.args[0][1]).to.deep.equal([
        '--set',
        'channel_binding=disable',
      ])
    })

    it('passes cmdArgs to interactiveSession when running interactively for advanced tier', async function () {
      await runCommand(DataPgPsql, [
        'DATABASE',
        '--app',
        'myapp',
      ])

      expect(psqlServiceInteractiveStub.calledOnce).to.be.true
      expect(psqlServiceInteractiveStub.args[0][0]).to.deep.equal([
        '--set',
        'channel_binding=require',
      ])
    })
  })

  describe('advanced tier (privately networked)', function () {
    beforeEach(function () {
      stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(db)
      psqlServiceExecQueryStub = stub(utils.pg.PsqlService.prototype, 'execQuery').resolves('')
      psqlServiceExecFileStub = stub(utils.pg.PsqlService.prototype, 'execFile').resolves('')
      psqlServiceInteractiveStub = stub(utils.pg.PsqlService.prototype, 'interactiveSession').resolves('')
      runThroughOneOffDynoSpy = stub(DataPgPsql.prototype, 'runThroughOneOffDyno').resolves()
    })

    const db = {
      attachment: {
        addon: {
          name: 'postgres-1',
          plan: {
            name: 'heroku-postgresql:advanced-private',
          },
        },
        app: {name: 'myapp'}, config_vars: [
          'DATABASE_URL',
          'DATABASE_ANALYTICS_URL',
        ],
        name: 'DATABASE',
      }, connStringVar: 'DATABASE_URL', database: 'mydb', host: 'localhost', password: 'pass', port: 5432,
      user: 'jeff',
    } as unknown as pg.ConnectionDetails

    it("errors out with '--file' option", async function () {
      const {error, stdout} = await runCommand(DataPgPsql, [
        'DATABASE',
        '--app',
        'myapp',
        '--file',
        'test.sql',
      ])
      const {message, oclif} = error as CLIError
      expect(message).to.eq("You can't use the --file flag on private networked Advanced databases.")
      expect(oclif.exit).to.eq(1)

      expect(psqlServiceExecFileStub.called).to.be.false
      expect(stdout).to.equal('')
    })

    it('runs psql command on a one-off dyno', async function () {
      const expectedOptions: Partial<DynoOpts> = {
        app: 'myapp',
        attach: true,
        command: 'psql -c "SELECT 1" --set sslmode=require --set channel_binding=require $DATABASE_URL',
        env: "PGAPPNAME='psql non-interactive';PGSSLMODE=require;PGCHANNELBINDING=require",
        'exit-code': true,
      }

      const {stdout} = await runCommand(DataPgPsql, [
        'DATABASE',
        '--app',
        'myapp',
        '--command',
        'SELECT 1',
      ])

      expect(stdout).to.equal('')
      expect(runThroughOneOffDynoSpy.args[0][0]).to.include(expectedOptions)
    })

    it('runs an interactive psql session on a one-off dyno', async function () {
      const expectedOptions: Partial<DynoOpts> = {
        app: 'myapp',
        attach: true,
        command: 'psql --set PROMPT1="myapp::DATABASE%R%# " --set PROMPT2="myapp::DATABASE%R%# " --set sslmode=require --set channel_binding=require $DATABASE_URL',
        env: "PGAPPNAME='psql interactive';PGSSLMODE=require;PGCHANNELBINDING=require",
        'exit-code': true,
      }

      const {stdout} = await runCommand(DataPgPsql, [
        'DATABASE',
        '--app',
        'myapp',
      ])

      expect(stdout).to.equal('')
      expect(runThroughOneOffDynoSpy.args[0][0]).to.include(expectedOptions)
    })
  })
})
