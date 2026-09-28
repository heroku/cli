import type {HerokuSDK} from '@heroku/sdk'
import type {TransferInfoByAppResult} from '@heroku/types/data'

import {expect} from 'chai'
import {stub} from 'sinon'

import {
  filesize, name, num, status,
} from '../../../../src/lib/pg/backups.js'

type Data = HerokuSDK['data']

describe('Backups', function () {
  describe('filesize', function () {
    it('displays 2 decimal places when the `decimalPlaces` option is not provided', function () {
      const result = filesize(1536)

      expect(result).to.equal('1.50KB')
    })

    it('displays 2 decimal places when the `decimalPlaces` option is provided and is a value other than 2', function () {
      const result = filesize(1536, {decimalPlaces: 0})

      expect(result).to.equal('1.50KB')
    })

    it('displays 2 decimal places when the `fixedDecimals` option is not provided', function () {
      const result = filesize(1536)

      expect(result).to.equal('1.50KB')
    })

    it('displays 2 decimal places when the `fixedDecimals` option is provided and is set to `false`', function () {
      const result = filesize(1536, {fixedDecimals: false})

      expect(result).to.equal('1.50KB')
    })
  })

  describe('status', function () {
    it('returns warnings when the backup transfer successfully completed, but warnings are present', function () {
      const transfer = {
        finished_at: '2025-01-01T00:00:00Z',
        succeeded: true,
        warnings: 3,
      } as TransferInfoByAppResult

      const result = status(transfer)
      expect(result).to.equal('Finished with 3 warnings')
    })

    it('returns the time the transfer completed when the backup transfer successfully completes without warning', function () {
      const transfer = {
        finished_at: '2025-01-01T00:00:00Z',
        succeeded: true,
        warnings: 0,
      } as TransferInfoByAppResult

      const result = status(transfer)
      expect(result).to.equal('Completed 2025-01-01T00:00:00Z')
    })

    it('returns a failure message when the transfer completes, but is not marked as having succeeded.', function () {
      const transfer = {
        finished_at: '2025-01-01T00:00:00Z',
        succeeded: false,
      } as TransferInfoByAppResult

      const result = status(transfer)
      expect(result).to.equal('Failed 2025-01-01T00:00:00Z')
    })

    it('returns a running message when the transfer has been started, but is not yet finished', function () {
      const transfer = {
        finished_at: '',
        processed_bytes: 1536,
        started_at: '2025-01-01T00:00:00Z',
      } as TransferInfoByAppResult

      const result = status(transfer)
      expect(result).to.equal('Running (processed 1.50KB)')
    })

    it('returns a pending message when the transfer has neither started nor finished', function () {
      const transfer = {
        finished_at: '',
        started_at: '',
      } as TransferInfoByAppResult

      const result = status(transfer)
      expect(result).to.equal('Pending')
    })
  })

  describe('num', function () {
    const app = 'my-app'
    
    it('resolves to the numerical portion of the `name` when the `name` begins with `a`, `b`, `c`, or `r` and is followed by one or more digits upto the end of the `name`', async function () {
      const mockSDK = {} as Data
      expect(await num('a123', app, mockSDK)).to.equal(123)
      expect(await num('b456', app, mockSDK)).to.equal(456)
      expect(await num('c789', app, mockSDK)).to.equal(789)
      expect(await num('r012', app, mockSDK)).to.equal(12)
    })

    it('resolves to the `num` value of the transfer having a name that matches the provided `name`, when `name` begins with either `oa` or `ob` and is followed by one or more digits upto the end of the `name`', async function () {
      const mockSDK = {
        transfer: {
          listByApp: stub().resolves([
            {num: 42, options: {pgbackups_name: 'a123'}},
            {num: 99, options: {pgbackups_name: 'b456'}},
          ]),
        },
      } as unknown as Data

      const result = await num('oa123', app, mockSDK)
      expect(result).to.equal(42)
    })

    it('resolves to undefined when the name does not match any known pattern', async function () {
      const mockSDK = {} as Data

      expect(await num('xyz123', app, mockSDK)).to.be.undefined
      expect(await num('123', app, mockSDK)).to.be.undefined
      expect(await num('a', app, mockSDK)).to.be.undefined
    })
  })

  describe('name', function () {
    it('returns the old PG backup name prefixed with an `o`, when it is present on the provided `transfer`', function () {
      const transfer = {
        options: {pgbackups_name: 'a123'},
      } as unknown as TransferInfoByAppResult

      const result = name(transfer)
      expect(result).to.equal('oa123')
    })

    it('returns the name composed of a prefix of `c` and a suffix of the transfer number when the transfer is from `pg_dump` to `pg_restore`', function () {
      const transfer = {
        from_type: 'pg_dump',
        num: 5,
        to_type: 'pg_restore',
      } as unknown as TransferInfoByAppResult

      const result = name(transfer)
      expect(result).to.equal('c005')
    })

    it('returns the name composed of a prefix of `a` and a suffix of the transfer number when the transfer is from `pg_dump` and the transfer has a schedule property present', function () {
      const transfer = {
        from_type: 'pg_dump',
        num: 7,
        schedule: {uuid: 'some-schedule-id'},
        to_type: 'xxxxxxxxxx',
      } as unknown as TransferInfoByAppResult

      const result = name(transfer)
      expect(result).to.equal('a007')
    })

    it('returns the name composed of a prefix of `b` and a suffix of the transfer number when the transfer is from `pg_dump` and the transfer lacks a schedule property', function () {
      const transfer = {
        from_type: 'pg_dump',
        num: 3,
        to_type: 'door_number_three',
      } as unknown as TransferInfoByAppResult

      const result = name(transfer)
      expect(result).to.equal('b003')
    })

    it('returns the name composed of a prefix of `r` and a suffix of the transfer number when the transfer is to `pg_restore`', function () {
      const transfer = {
        from_type: 'cow',
        num: 12,
        to_type: 'pg_restore',
      } as unknown as TransferInfoByAppResult

      const result = name(transfer)
      expect(result).to.equal('r012')
    })

    it('returns the name composed of a prefix of `b` is not from `pg_dump` and is not to `pg_restore`', function () {
      const transfer = {
        from_type: 'cats',
        num: 8,
        to_type: 'kittens',
      } as unknown as TransferInfoByAppResult

      const result = name(transfer)
      expect(result).to.equal('b008')
    })
  })
})
