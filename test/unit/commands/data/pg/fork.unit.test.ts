/* eslint-disable mocha/no-setup-in-describe */
/* eslint-disable max-nested-callbacks */
import {Config} from '@oclif/core'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import Fork from '../../../../../src/commands/data/pg/fork.js'
import {
  addon,
  createForkResponse,
  nonAdvancedAddon,
  pgInfo,
} from '../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../helpers/runCommand.js'

const stubbedDate = new Date('2025-01-31T00:00:00+00:00')
const heredoc = tsheredoc.default

describe('data:pg:fork', function () {
  beforeEach(function () {
    sinon.useFakeTimers({
      now: stubbedDate,
      shouldAdvanceTime: false,
      toFake: ['Date'],
    })
    sinon.stub(Fork.prototype, 'notify').resolves()
  })

  afterEach(function () {
    sinon.restore()
  })

  describe('basic fork functionality', function () {
    it('creates a fork from an existing database', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .post('/apps/myapp/addons', {
          attachment: {},
          config: {
            fork: 'advanced-horizontal-01234',
            level: '4G-Performance',
          },
          plan: {name: 'heroku-postgresql:advanced-beta'},
        })
        .reply(200, createForkResponse)

      const dataApi = nock('https://test.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/info`)
        .reply(200, pgInfo)

      await runCommand(Fork, [
        'advanced-horizontal-01234',
        '--app=myapp',
      ])

      herokuApi.done()
      dataApi.done()
      expect(ansis.strip(stderr.output)).to.equal(heredoc`
        Creating a fork for advanced-horizontal-01234 on ⬢ myapp... done
      `)
      expect(stdout.output).to.equal(
        heredoc(`
          Your forked database is being provisioned
          advanced-oblique-01234 is being created in the background. The app will restart when complete...
          Run heroku data:pg:info advanced-oblique-01234 -a myapp to check creation progress.
        `),
      )
    })

    it('creates a fork with custom name and attachment', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .post('/apps/myapp/addons', {
          attachment: {name: 'DATABASE_COPY'},
          config: {
            fork: 'advanced-horizontal-01234',
            level: '4G-Performance',
          },
          name: 'my-forked-db',
          plan: {name: 'heroku-postgresql:advanced-beta'},
        })
        .reply(200, createForkResponse)

      const dataApi = nock('https://test.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/info`)
        .reply(200, pgInfo)

      await runCommand(Fork, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--name=my-forked-db',
        '--as=DATABASE_COPY',
      ])

      herokuApi.done()
      dataApi.done()
      expect(ansis.strip(stderr.output)).to.equal(heredoc`
        Creating a fork for advanced-horizontal-01234 on ⬢ myapp... done
      `)
      expect(stdout.output).to.equal(
        heredoc(`
          Your forked database is being provisioned
          advanced-oblique-01234 is being created in the background. The app will restart when complete...
          Run heroku data:pg:info advanced-oblique-01234 -a myapp to check creation progress.
        `),
      )
    })

    it('creates a fork with custom level', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .post('/apps/myapp/addons', {
          attachment: {},
          config: {
            fork: 'advanced-horizontal-01234',
            level: '8G-Performance',
          },
          plan: {name: 'heroku-postgresql:advanced-beta'},
        })
        .reply(200, createForkResponse)

      await runCommand(Fork, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--level=8G-Performance',
      ])

      herokuApi.done()
      expect(ansis.strip(stderr.output)).to.equal(heredoc`
        Creating a fork for advanced-horizontal-01234 on ⬢ myapp... done
      `)
      expect(stdout.output).to.equal(
        heredoc(`
          Your forked database is being provisioned
          advanced-oblique-01234 is being created in the background. The app will restart when complete...
          Run heroku data:pg:info advanced-oblique-01234 -a myapp to check creation progress.
        `),
      )
    })

    it('creates a fork with provision options', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .post('/apps/myapp/addons', (body: any) => body.config.level === '4G-Performance'
            && body.config.fork === 'advanced-horizontal-01234'
            && body.config.foo === 'bar'
            && body.config.baz === 'true'
            && body.config.key === 'value:with:colons')
        .reply(200, createForkResponse)

      const dataApi = nock('https://test.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/info`)
        .reply(200, pgInfo)

      await runCommand(Fork, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--provision-option=foo:bar',
        '--provision-option=baz',
        '--provision-option=key:value:with:colons',
      ])

      herokuApi.done()
      dataApi.done()
      expect(ansis.strip(stderr.output)).to.equal(heredoc`
        Creating a fork for advanced-horizontal-01234 on ⬢ myapp... done
      `)
    })
  })

  describe('rollback functionality', function () {
    it('creates a rollback fork with rollback-to timestamp', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .post('/apps/myapp/addons', {
          attachment: {},
          config: {
            level: '4G-Performance',
            'recovery-time': '2025-01-11T12:35:00',
            rollback: 'advanced-horizontal-01234',
          },
          plan: {name: 'heroku-postgresql:advanced-beta'},
        })
        .reply(200, createForkResponse)

      const dataApi = nock('https://test.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/info`)
        .reply(200, {
          ...pgInfo,
          forked_from: {
            id: addon.id,
            name: addon.name,
          },
        })

      await runCommand(Fork, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--rollback-to=2025-01-11T12:35:00',
      ])

      herokuApi.done()
      dataApi.done()
      expect(ansis.strip(stderr.output)).to.equal(heredoc`
        Creating a fork for advanced-horizontal-01234 on ⬢ myapp with a rollback to 2025-01-11T12:35:00... done
      `)
      expect(stdout.output).to.equal(
        heredoc(`
          Your forked database is being provisioned
          advanced-oblique-01234 is being created in the background. The app will restart when complete...
          Run heroku data:pg:info advanced-oblique-01234 -a myapp to check creation progress.
        `),
      )
    })

    it('creates a rollback fork with rollback-by interval', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .post('/apps/myapp/addons', {
          attachment: {},
          config: {
            level: '4G-Performance',
            'recovery-time': '2025-01-30T00:00:00',
            rollback: 'advanced-horizontal-01234',
          },
          plan: {name: 'heroku-postgresql:advanced-beta'},
        })
        .reply(200, createForkResponse)

      const dataApi = nock('https://test.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/info`)
        .reply(200, {
          ...pgInfo,
          forked_from: {
            id: addon.id,
            name: addon.name,
          },
        })

      await runCommand(Fork, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--rollback-by=1 day',
      ])

      herokuApi.done()
      dataApi.done()
      expect(ansis.strip(stderr.output)).to.equal(heredoc`
        Creating a fork for advanced-horizontal-01234 on ⬢ myapp with a rollback by 1 day... done
      `)
      expect(stdout.output).to.equal(
        heredoc(`
          Your forked database is being provisioned
          advanced-oblique-01234 is being created in the background. The app will restart when complete...
          Run heroku data:pg:info advanced-oblique-01234 -a myapp to check creation progress.
        `),
      )
    })

    it('creates a rollback fork with provision options', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .post('/apps/myapp/addons', (body: any) => body.config.level === '4G-Performance'
            && body.config.rollback === 'advanced-horizontal-01234'
            && body.config['recovery-time'] === '2025-01-11T12:35:00'
            && body.config.foo === 'bar'
            && body.config.baz === 'true')
        .reply(200, createForkResponse)

      const dataApi = nock('https://test.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/info`)
        .reply(200, {
          ...pgInfo,
          forked_from: {
            id: addon.id,
            name: addon.name,
          },
        })

      await runCommand(Fork, [
        'advanced-horizontal-01234',
        '--app=myapp',
        '--rollback-to=2025-01-11T12:35:00',
        '--provision-option=foo:bar',
        '--provision-option=baz',
      ])

      herokuApi.done()
      dataApi.done()
      expect(ansis.strip(stderr.output)).to.equal(heredoc`
        Creating a fork for advanced-horizontal-01234 on ⬢ myapp with a rollback to 2025-01-11T12:35:00... done
      `)
    })
  })

  describe('error handling', function () {
    it('shows error for non-Advanced databases', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [nonAdvancedAddon])

      try {
        await runCommand(Fork, [
          'advanced-horizontal-01234',
          '--app=myapp',
        ])
      } catch (error) {
        const err = error as Error
        expect(ansis.strip(err.message)).to.equal(heredoc`
          You can only use this command on Advanced-tier databases.
          Use heroku addons:create heroku-postgresql:standard-0 -a myapp -- --fork standard-database instead.`,
        )
      }

      herokuApi.done()
    })

    it('shows error for non-Advanced databases with rollback to', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [nonAdvancedAddon])

      try {
        await runCommand(Fork, [
          'advanced-horizontal-01234',
          '--app=myapp',
          '--rollback-to=2025-08-11T12:35:00',
        ])
      } catch (error) {
        const err = error as Error
        expect(ansis.strip(err.message)).to.equal(heredoc`
          You can only use this command on Advanced-tier databases.
          Use heroku addons:create heroku-postgresql:standard-0 -a myapp -- --rollback standard-database --to '2025-08-11T12:35:00' instead.`,
        )
      }

      herokuApi.done()
    })

    it('shows error for non-Advanced databases with rollback by', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [nonAdvancedAddon])

      try {
        await runCommand(Fork, [
          'advanced-horizontal-01234',
          '--app=myapp',
          '--rollback-by=3 days 7 hours 22 minutes',
        ])
      } catch (error) {
        const err = error as Error
        expect(ansis.strip(err.message)).to.equal(heredoc`
          You can only use this command on Advanced-tier databases.
          Use heroku addons:create heroku-postgresql:standard-0 -a myapp -- --rollback standard-database --by '3 days 7 hours 22 minutes' instead.`,
        )
      }

      herokuApi.done()
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

      testCases.forEach(({description, expected, input}) => {
        it(description, function () {
          const result = fork.parseRollbackInterval(input)
          expect(result.toISOString()).to.equal(expected)
        })
      })
    })

    describe('invalid intervals', function () {
      const errorCases: Array<{description: string; input: string}> = [
        {description: 'rejects invalid text', input: 'invalid input'},
        {description: 'rejects empty string', input: ''},
        {description: 'rejects just numbers', input: '5'},
        {description: 'rejects invalid numbers', input: 'xyz days'},
      ]

      errorCases.forEach(({description, input}) => {
        it(description, function () {
          try {
            fork.parseRollbackInterval(input)
            expect.fail('Should have thrown an error')
          } catch (error) {
            const err = error as Error
            expect(ansis.strip(err.message)).to.include("isn't a supported time interval")
          }
        })
      })
    })
  })
})
