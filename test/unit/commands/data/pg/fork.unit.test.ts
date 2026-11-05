
import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {type ForkResult} from '@heroku/sdk/extensions/data'
import {NotAdvancedDatabaseError} from '@heroku/sdk/resources/data/postgres-database'
import {Config} from '@oclif/core'
import ansis from 'ansis'
import {expect} from 'chai'
import * as chrono from 'chrono-node'
import {
  restore, SinonStub, stub, useFakeTimers,
} from 'sinon'
import tsheredoc from 'tsheredoc'

import Fork from '../../../../../src/commands/data/pg/fork.js'
import {
  addon,
  createForkResponse,
  nonAdvancedAddon,
} from '../../../../fixtures/data/pg/fixtures.js'

const stubbedDate = new Date('2025-01-31T00:00:00+00:00')
const heredoc = tsheredoc

interface FakeData {
  postgres: {fork: SinonStub}
}

type ForkBody = {
  [key: string]: unknown
  config?: Record<string, unknown>
  recoveryTime?: Date | string
}

type ForkOptions = {
  onPoll?: (status: unknown) => void
  onProvisioning?: (addon: unknown) => Promise<void> | void
  onResolved?: (source: unknown) => Promise<void> | void
  wait?: boolean
}

// The command owns flag parsing, the chrono interval parsing, the spinner, and
// output rendering, but delegates source resolution, the Advanced-tier check,
// level defaulting, and config building to data.postgres.fork. This fake stands
// in for fork: it returns the created fork add-on (and its resolved source),
// driving the wait hooks only when `wait` is set — so the command's UX branches
// are exercised without any HTTP.
const forkResolving = (forkAddon = createForkResponse, source = addon) =>
  async (_app: string, _source: string, body: ForkBody, options: ForkOptions = {}) => {
    // The SDK resolves and tier-checks the source first, then fires onResolved
    // (which starts the command's deferred create spinner) before creating.
    await options.onResolved?.(source)

    if (options.wait) {
      await options.onProvisioning?.(forkAddon)
      options.onPoll?.({message: 'available', waiting: false})
    }

    return {addon: forkAddon, source}
  }

describe('data:pg:fork', function () {
  let fakeData: FakeData

  beforeEach(function () {
    useFakeTimers({
      now: stubbedDate,
      shouldAdvanceTime: false,
      toFake: ['Date'],
    })
    fakeData = {postgres: {fork: stub().callsFake(forkResolving())}}
    stub(HerokuSDK.prototype, 'data').get(() => fakeData)
    stub(Fork.prototype, 'notify').resolves()
  })

  afterEach(function () {
    restore()
  })

  describe('basic fork functionality', function () {
    it('creates a fork from an existing database', async function () {
      const {stderr, stdout} = await runCommand(Fork, [
        'advanced-horizontal-01234',
        '--app=myapp',
      ])

      const [app, source, body] = fakeData.postgres.fork.firstCall.args
      expect(app).to.equal('myapp')
      expect(source).to.equal('advanced-horizontal-01234')
      expect(body.level).to.be.undefined
      expect(body.recoveryTime).to.be.undefined
      expect(body.config).to.deep.equal({})
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Creating a fork for advanced-horizontal-01234 on ⬢ myapp... done
      `)
      expect(stdout).to.equal(heredoc(`
          Your forked database is being provisioned
          advanced-oblique-01234 is being created in the background. The app will restart when complete...
          Run heroku data:pg:info advanced-oblique-01234 -a myapp to check creation progress.
        `))
    })

    it('creates a fork with custom name and attachment', async function () {
      const {stderr, stdout} = await runCommand(Fork, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--name=my-forked-db',
        '--as=DATABASE_COPY',
      ])

      const body = fakeData.postgres.fork.firstCall.args[2]
      expect(body.name).to.equal('my-forked-db')
      expect(body.as).to.equal('DATABASE_COPY')
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Creating a fork for advanced-horizontal-01234 on ⬢ myapp... done
      `)
      expect(stdout).to.equal(heredoc(`
          Your forked database is being provisioned
          advanced-oblique-01234 is being created in the background. The app will restart when complete...
          Run heroku data:pg:info advanced-oblique-01234 -a myapp to check creation progress.
        `))
    })

    it('creates a fork with custom level', async function () {
      const {stderr, stdout} = await runCommand(Fork, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--level=8G-Performance',
      ])

      const body = fakeData.postgres.fork.firstCall.args[2]
      expect(body.level).to.equal('8G-Performance')
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Creating a fork for advanced-horizontal-01234 on ⬢ myapp... done
      `)
      expect(stdout).to.equal(heredoc(`
          Your forked database is being provisioned
          advanced-oblique-01234 is being created in the background. The app will restart when complete...
          Run heroku data:pg:info advanced-oblique-01234 -a myapp to check creation progress.
        `))
    })

    it('creates a fork with provision options', async function () {
      const {stderr} = await runCommand(Fork, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--provision-option=foo:bar',
        '--provision-option=baz',
        '--provision-option=key:value:with:colons',
      ])

      const body = fakeData.postgres.fork.firstCall.args[2]
      expect(body.config).to.deep.equal({
        baz: 'true',
        foo: 'bar',
        key: 'value:with:colons',
      })
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Creating a fork for advanced-horizontal-01234 on ⬢ myapp... done
      `)
    })

    it('labels the spinner with the resolved source, not the raw identity typed', async function () {
      // The user can pass an attachment name or config var; the SDK resolves it
      // to the add-on and fires onResolved with the resolved add-on. The spinner
      // the command defers to that hook must name the resolved add-on
      // (advanced-horizontal-01234), not the raw "DATABASE_URL" the user typed.
      const {stderr} = await runCommand(Fork, [
        'DATABASE_URL',
        '--app=myapp',
      ])

      const source = fakeData.postgres.fork.firstCall.args[1]
      expect(source).to.equal('DATABASE_URL')
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Creating a fork for advanced-horizontal-01234 on ⬢ myapp... done
      `)
    })

    it('runs the two-phase wait UX and returns the fork result with --wait', async function () {
      const {error, result, stderr, stdout} = await runCommand<ForkResult>(Fork, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--wait',
      ])

      expect(error).to.be.undefined
      expect(fakeData.postgres.fork.firstCall.args[3].wait).to.be.true
      // Create phase closes, then the wait phase wraps the poll loop.
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Creating a fork for advanced-horizontal-01234 on ⬢ myapp... done
        Creating advanced-oblique-01234... done
      `)
      expect(stdout).to.equal(heredoc(`
          Your forked database is being provisioned
          Waiting for advanced-oblique-01234...
          Created advanced-oblique-01234
        `))
      // run() returns the SDK result so the command composes.
      expect(result?.addon).to.equal(createForkResponse)
      expect(result?.source).to.equal(addon)
    })
  })

  describe('rollback functionality', function () {
    it('creates a rollback fork with rollback-to timestamp', async function () {
      const {stderr, stdout} = await runCommand(Fork, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--rollback-to=2025-01-11T12:35:00',
      ])

      const body = fakeData.postgres.fork.firstCall.args[2]
      expect(body.recoveryTime).to.equal('2025-01-11T12:35:00')
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Creating a fork for advanced-horizontal-01234 on ⬢ myapp with a rollback to 2025-01-11T12:35:00... done
      `)
      expect(stdout).to.equal(heredoc(`
          Your forked database is being provisioned
          advanced-oblique-01234 is being created in the background. The app will restart when complete...
          Run heroku data:pg:info advanced-oblique-01234 -a myapp to check creation progress.
        `))
    })

    it('creates a rollback fork with rollback-by interval', async function () {
      const {stderr, stdout} = await runCommand(Fork, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--rollback-by=1 day',
      ])

      // The CLI parses the interval to a Date (the SDK formats it to the
      // platform timestamp); with the clock pinned to 2025-01-31, "1 day" ago is
      // 2025-01-30T00:00:00Z.
      const body = fakeData.postgres.fork.firstCall.args[2]
      expect(body.recoveryTime).to.be.instanceOf(Date)
      expect((body.recoveryTime as Date).toISOString()).to.equal('2025-01-30T00:00:00.000Z')
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Creating a fork for advanced-horizontal-01234 on ⬢ myapp with a rollback by 1 day... done
      `)
      expect(stdout).to.equal(heredoc(`
          Your forked database is being provisioned
          advanced-oblique-01234 is being created in the background. The app will restart when complete...
          Run heroku data:pg:info advanced-oblique-01234 -a myapp to check creation progress.
        `))
    })

    it('creates a rollback fork with provision options', async function () {
      const {stderr} = await runCommand(Fork, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--rollback-to=2025-01-11T12:35:00',
        '--provision-option=foo:bar',
        '--provision-option=baz',
      ])

      const body = fakeData.postgres.fork.firstCall.args[2]
      expect(body.recoveryTime).to.equal('2025-01-11T12:35:00')
      expect(body.config).to.deep.equal({baz: 'true', foo: 'bar'})
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Creating a fork for advanced-horizontal-01234 on ⬢ myapp with a rollback to 2025-01-11T12:35:00... done
      `)
    })
  })

  describe('error handling', function () {
    // The SDK resolves and tier-checks the source, rejecting with
    // NotAdvancedDatabaseError (carrying the resolved source); the command
    // renders the classic-command hint from the source the error carries.
    it('shows error for non-Advanced databases', async function () {
      fakeData.postgres.fork.rejects(new NotAdvancedDatabaseError(nonAdvancedAddon, 'not advanced'))

      const {error, stderr} = await runCommand(Fork, [
        'advanced-horizontal-01234',
        '--app=myapp',
      ])
      const err = error as Error
      expect(ansis.strip(err.message)).to.equal(heredoc`
          You can only use this command on Advanced-tier databases.
          Use heroku addons:create heroku-postgresql:standard-0 -a myapp -- --fork standard-database instead.`)
      // The create spinner is deferred to the SDK's onResolved hook, which only
      // fires once the tier check passes. A classic source rejects before that,
      // so no "Creating a fork" line should ever reach the terminal.
      expect(ansis.strip(stderr)).to.not.include('Creating a fork')
    })

    it('surfaces a captured wait failure as a thrown error', async function () {
      // fork keeps the created fork and reports a failed wait on the result
      // instead of throwing; the command must still surface it as a failed run.
      const waitError = new Error('wait polling failed')
      fakeData.postgres.fork.callsFake(async () => ({addon: createForkResponse, source: addon, waitError}))

      const {error} = await runCommand(Fork, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--wait',
      ])

      expect(error).to.equal(waitError)
    })

    it('shows error for non-Advanced databases with rollback to', async function () {
      fakeData.postgres.fork.rejects(new NotAdvancedDatabaseError(nonAdvancedAddon, 'not advanced'))

      const {error} = await runCommand(Fork, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--rollback-to=2025-08-11T12:35:00',
      ])
      const err = error as Error
      expect(ansis.strip(err.message)).to.equal(heredoc`
          You can only use this command on Advanced-tier databases.
          Use heroku addons:create heroku-postgresql:standard-0 -a myapp -- --rollback standard-database --to '2025-08-11T12:35:00' instead.`)
    })

    it('shows error for non-Advanced databases with rollback by', async function () {
      fakeData.postgres.fork.rejects(new NotAdvancedDatabaseError(nonAdvancedAddon, 'not advanced'))

      const {error} = await runCommand(Fork, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--rollback-by=3 days 7 hours 22 minutes',
      ])
      const err = error as Error
      expect(ansis.strip(err.message)).to.equal(heredoc`
          You can only use this command on Advanced-tier databases.
          Use heroku addons:create heroku-postgresql:standard-0 -a myapp -- --rollback standard-database --by '3 days 7 hours 22 minutes' instead.`)
    })
  })

  describe('parseRollbackInterval', function () {
    let fork: InstanceType<typeof Fork>

    beforeEach(function () {
      fork = new Fork([], {} as Config)
    })

    describe('valid intervals', function () {
      const testCases: Array<{description: string; expected: string; input: string}> = [
        // Simple time intervals
        {description: 'parses days', expected: '2025-01-28T00:00:00.000Z', input: '3 days'},
        {description: 'parses single day', expected: '2025-01-30T00:00:00.000Z', input: '1 day'},
        {description: 'parses hours', expected: '2025-01-30T18:00:00.000Z', input: '6 hours'},
        {description: 'parses minutes', expected: '2025-01-30T23:30:00.000Z', input: '30 minutes'},
        {description: 'parses weeks', expected: '2025-01-17T00:00:00.000Z', input: '2 weeks'},

        // Complex intervals
        {description: 'parses days and hours', expected: '2025-01-27T17:00:00.000Z', input: '3 days 7 hours'},
        {description: 'parses days, hours, and minutes', expected: '2025-01-28T18:30:00.000Z', input: '2 days 5 hours 30 minutes'},
        {description: 'parses hours and minutes', expected: '2025-01-30T11:15:00.000Z', input: '12 hours 45 minutes'},
        {description: 'handles example from flag description', expected: '2025-01-27T16:38:00.000Z', input: '3 days 7 hours 22 minutes'},

        // With "ago" suffix
        {description: 'handles "ago" suffix without doubling', expected: '2025-01-28T00:00:00.000Z', input: '3 days ago'},
        {description: 'handles complex interval with "ago"', expected: '2025-01-28T19:00:00.000Z', input: '2 days 5 hours ago'},
        {description: 'handles "1 day ago"', expected: '2025-01-30T00:00:00.000Z', input: '1 day ago'},

        // Edge cases
        {description: 'handles singular forms', expected: '2025-01-30T23:00:00.000Z', input: '1 hour'},
        {description: 'handles extra spacing', expected: '2025-01-28T00:00:00.000Z', input: '  3 days  '},
        {description: 'handles mixed case', expected: '2025-01-28T00:00:00.000Z', input: '3 Days'},
        {description: 'handles 24 hours', expected: '2025-01-30T00:00:00.000Z', input: '24 hours'},
      ]

      for (const {description, expected, input} of testCases) {
        it(description, function () {
          const result = fork.parseRollbackInterval(input, chrono)
          expect(result.toISOString()).to.equal(expected)
        })
      }
    })

    describe('invalid intervals', function () {
      const errorCases: Array<{description: string; input: string}> = [
        {description: 'rejects invalid text', input: 'invalid input'},
        {description: 'rejects empty string', input: ''},
        {description: 'rejects just numbers', input: '5'},
        {description: 'rejects invalid numbers', input: 'xyz days'},
      ]

      for (const {description, input} of errorCases) {
        it(description, function () {
          try {
            fork.parseRollbackInterval(input, chrono)
            expect.fail('Should have thrown an error')
          } catch (error) {
            const err = error as Error
            expect(ansis.strip(err.message)).to.include("isn't a supported time interval")
          }
        })
      }
    })
  })
})
