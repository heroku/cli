import {APIClient} from '@heroku-cli/command'
import {expect} from 'chai'
import sinon from 'sinon'
import {ux} from '@oclif/core'

import backupsFactory from '../../../../src/lib/pg/backups.js'
import type {BackupTransfer} from '../../../../src/lib/pg/types.js'

describe('Backups', function () {
  describe('constructor', function () {
    it('requires an `app` string and a `heroku` API client', function () {
      const mockHeroku = {} as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      expect(backups).to.be.an('object')
      expect(backups).to.have.property('filesize').that.is.a('function')
      expect(backups).to.have.property('status').that.is.a('function')
      expect(backups).to.have.property('num').that.is.a('function')
      expect(backups).to.have.property('name').that.is.a('function')
      expect(backups).to.have.property('wait').that.is.a('function')
    })
  })

  describe('filesize', function () {
    it('displays 2 decimal places when the `decimalPlaces` option is not provided', function () {
      const mockHeroku = {} as APIClient
      const backups = backupsFactory('my-app', mockHeroku)
      const result = backups.filesize(1536)

      expect(result).to.equal('1.50KB')
    })

    it('displays 2 decimal places when the `decimalPlaces` option is provided and is a value other than 2', function () {
      const mockHeroku = {} as APIClient
      const backups = backupsFactory('my-app', mockHeroku)
      const result = backups.filesize(1536, {decimalPlaces: 0})

      expect(result).to.equal('1.50KB')
    })

    it('displays 2 decimal places when the `fixedDecimals` option is not provided', function () {
      const mockHeroku = {} as APIClient
      const backups = backupsFactory('my-app', mockHeroku)
      const result = backups.filesize(1536)

      expect(result).to.equal('1.50KB')
    })

    it('displays 2 decimal places when the `fixedDecimals` option is provided and is set to `false`', function () {
      const mockHeroku = {} as APIClient
      const backups = backupsFactory('my-app', mockHeroku)
      const result = backups.filesize(1536, {fixedDecimals: false})

      expect(result).to.equal('1.50KB')
    })
  })

  describe('status', function () {
    it('returns warnings when the backup transfer successfully completed, but warnings are present', function () {
      const mockHeroku = {} as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      const transfer = {
        finished_at: '2025-01-01T00:00:00Z',
        succeeded: true,
        warnings: 3,
      } as BackupTransfer

      const result = backups.status(transfer)
      expect(result).to.equal('Finished with 3 warnings')
    })

    it('returns the time the transfer completed when the backup transfer successfully completes without warning', function () {
      const mockHeroku = {} as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      const transfer = {
        finished_at: '2025-01-01T00:00:00Z',
        succeeded: true,
        warnings: 0,
      } as BackupTransfer

      const result = backups.status(transfer)
      expect(result).to.equal('Completed 2025-01-01T00:00:00Z')
    })

    it('returns a failure message when the transfer completes, but is not marked as having succeeded.', function () {
      const mockHeroku = {} as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      const transfer = {
        finished_at: '2025-01-01T00:00:00Z',
        succeeded: false,
      } as BackupTransfer

      const result = backups.status(transfer)
      expect(result).to.equal('Failed 2025-01-01T00:00:00Z')
    })

    it('returns a running message when the transfer has been started, but is not yet finished', function () {
      const mockHeroku = {} as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      const transfer = {
        started_at: '2025-01-01T00:00:00Z',
        finished_at: '',
        processed_bytes: 1536,
      } as BackupTransfer

      const result = backups.status(transfer)
      expect(result).to.equal('Running (processed 1.50KB)')
    })

    it('returns a pending message when the transfer has neither started nor finished', function () {
      const mockHeroku = {} as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      const transfer = {
        started_at: '',
        finished_at: '',
      } as BackupTransfer

      const result = backups.status(transfer)
      expect(result).to.equal('Pending')
    })
  })

  describe('num', function () {
    it('resolves to the numerical portion of the `name` when the `name` begins with `a`, `b`, `c`, or `r` and is followed by one or more digits upto the end of the `name`', async function () {
      const mockHeroku = {} as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      expect(await backups.num('a123')).to.equal(123)
      expect(await backups.num('b456')).to.equal(456)
      expect(await backups.num('c789')).to.equal(789)
      expect(await backups.num('r012')).to.equal(12)
    })

    it('resolves to the `num` value of the transfer having a name that matches the provided `name`, when `name` begins with either `oa` or `ob` and is followed by one or more digits upto the end of the `name`', async function () {
      const mockHeroku = {
        get: sinon.stub().resolves({
          body: [
            {num: 42, options: {pgbackups_name: 'a123'}},
            {num: 99, options: {pgbackups_name: 'b456'}},
          ],
        }),
      } as unknown as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      const result = await backups.num('oa123')
      expect(result).to.equal(42)
    })

    it('resolves to undefined when the name does not match any known pattern', async function () {
      const mockHeroku = {} as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      expect(await backups.num('xyz123')).to.be.undefined
      expect(await backups.num('123')).to.be.undefined
      expect(await backups.num('a')).to.be.undefined
    })
  })

  describe('name', function () {
    it('returns the old PG backup name prefixed with an `o`, when it is present on the provided `transfer`', function () {
      const mockHeroku = {} as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      const transfer = {
        options: {pgbackups_name: 'a123'},
      } as unknown as BackupTransfer

      const result = backups.name(transfer)
      expect(result).to.equal('oa123')
    })

    it('returns the name composed of a prefix of `c` and a suffix of the transfer number when the transfer is from `pg_dump` to `pg_restore`', function () {
      const mockHeroku = {} as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      const transfer = {
        from_type: 'pg_dump',
        to_type: 'pg_restore',
        num: 5,
      } as unknown as BackupTransfer

      const result = backups.name(transfer)
      expect(result).to.equal('c005')
    })

    it('returns the name composed of a prefix of `a` and a suffix of the transfer number when the transfer is from `pg_dump` and the transfer has a schedule property present', function () {
      const mockHeroku = {} as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      const transfer = {
        from_type: 'pg_dump',
        to_type: 'xxxxxxxxxx',
        schedule: {uuid: 'some-schedule-id'},
        num: 7,
      } as unknown as BackupTransfer

      const result = backups.name(transfer)
      expect(result).to.equal('a007')
    })

    it('returns the name composed of a prefix of `b` and a suffix of the transfer number when the transfer is from `pg_dump` and the transfer lacks a schedule property', function () {
      const mockHeroku = {} as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      const transfer = {
        from_type: 'pg_dump',
        to_type: 'door_number_three',
        num: 3,
      } as unknown as BackupTransfer

      const result = backups.name(transfer)
      expect(result).to.equal('b003')
    })

    it('returns the name composed of a prefix of `r` and a suffix of the transfer number when the transfer is to `pg_restore`', function () {
      const mockHeroku = {} as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      const transfer = {
        from_type: 'cow',
        to_type: 'pg_restore',
        num: 12,
      } as unknown as BackupTransfer

      const result = backups.name(transfer)
      expect(result).to.equal('r012')
    })

    it('returns the name composed of a prefix of `b` is not from `pg_dump` and is not to `pg_restore`', function () {
      const mockHeroku = {} as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      const transfer = {
        from_type: 'cats',
        to_type: 'kittens',
        num: 8,
      } as unknown as BackupTransfer

      const result = backups.name(transfer)
      expect(result).to.equal('b008')
    })
  })

  describe('wait', function () {
    let stdoutStub: sinon.SinonStub
    let actionStartStub: sinon.SinonStub
    let actionStopStub: sinon.SinonStub
    let errorStub: sinon.SinonStub

    beforeEach(function () {
      stdoutStub = sinon.stub(ux, 'stdout')
      actionStartStub = sinon.stub(ux.action, 'start')
      actionStopStub = sinon.stub(ux.action, 'stop')
      errorStub = sinon.stub(ux, 'error')
    })

    afterEach(function () {
      stdoutStub.restore()
      actionStartStub.restore()
      actionStopStub.restore()
      errorStub.restore()
    })

    it('writes the action to stdout with trailing ellipsis when verbose is true', async function () {
      const mockHeroku = {
        get: sinon.stub().resolves({
          body: {finished_at: '2025-01-01T00:00:00Z', succeeded: true, logs: []},
        }),
      } as unknown as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      await backups.wait('Backing up', 'transfer-123', 1, true, 'my-app')

      expect(stdoutStub.calledWith('Backing up...')).to.be.true
    })

    it('does not write to stdout when verbose is false', async function () {
      const mockHeroku = {
        get: sinon.stub().resolves({
          body: {finished_at: '2025-01-01T00:00:00Z', succeeded: true, logs: []},
        }),
      } as unknown as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      await backups.wait('Backing up', 'transfer-123', 1, false, 'my-app')

      expect(stdoutStub.called).to.be.false
    })

    it('calls the start action with the provided action name', async function () {
      const mockHeroku = {
        get: sinon.stub().resolves({
          body: {finished_at: '2025-01-01T00:00:00Z', succeeded: true, logs: []},
        }),
      } as unknown as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      await backups.wait('Backing up', 'transfer-123', 1, false, 'my-app')

      expect(actionStartStub.calledWith('Backing up')).to.be.true
    })

    it('calls the stop action when the poll yields a successful backup', async function () {
      const mockHeroku = {
        get: sinon.stub().resolves({
          body: {finished_at: '2025-01-01T00:00:00Z', succeeded: true, logs: []},
        }),
      } as unknown as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      await backups.wait('Backing up', 'transfer-123', 1, false, 'my-app')

      expect(actionStopStub.calledOnce).to.be.true
      expect(actionStopStub.calledWith()).to.be.true
    })

    it('calls the stop action with "!" and calls ux.error when poll throws an error', async function () {
      const mockHeroku = {
        get: sinon.stub().resolves({
          body: {
            finished_at: '2025-01-01T00:00:00Z',
            succeeded: false,
            logs: [{created_at: '2025-01-01', message: 'Backup failed'}],
          },
        }),
      } as unknown as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      await backups.wait('Backing up', 'transfer-123', 1, false, 'my-app')

      expect(actionStopStub.calledWith('!')).to.be.true
      expect(errorStub.called).to.be.true
    })

    it('uses the provided app parameter when polling', async function () {
      const getStub = sinon.stub().resolves({
        body: {finished_at: '2025-01-01T00:00:00Z', succeeded: true, logs: []},
      })
      const mockHeroku = {get: getStub} as unknown as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      await backups.wait('Backing up', 'transfer-123', 1, false, 'other-app')

      expect(getStub.firstCall.args[0]).to.include('other-app')
    })

    it('falls back to the instance app when the app parameter is falsy', async function () {
      const getStub = sinon.stub().resolves({
        body: {finished_at: '2025-01-01T00:00:00Z', succeeded: true, logs: []},
      })
      const mockHeroku = {get: getStub} as unknown as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      await backups.wait('Backing up', 'transfer-123', 1, false, '')

      expect(getStub.firstCall.args[0]).to.include('my-app')
    })

    it('passes transferID, interval, and verbose to poll', async function () {
      const getStub = sinon.stub().resolves({
        body: {finished_at: '2025-01-01T00:00:00Z', succeeded: true, logs: []},
      })
      const mockHeroku = {get: getStub} as unknown as APIClient
      const backups = backupsFactory('my-app', mockHeroku)

      await backups.wait('Backing up', 'transfer-456', 1, true, 'my-app')

      // When verbose is true, the URL should include ?verbose=true
      expect(getStub.firstCall.args[0]).to.include('transfer-456')
      expect(getStub.firstCall.args[0]).to.include('verbose=true')
    })
  })
})
