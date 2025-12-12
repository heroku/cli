import {stdout} from 'stdout-stderr'
import Cmd from '../../../../src/commands/usage/addons.js'
import nock from 'nock'
import expectOutput from '../../../helpers/utils/expectOutput.js'
import runCommand from '../../../helpers/runCommand.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'
import * as Heroku from '@heroku-cli/schema'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'
import {expect} from 'chai'

describe('usage:addons', function () {
  let redisAddon: Heroku.AddOn

  beforeEach(function () {
    redisAddon = fixtures.addons['www-redis']
    nock.cleanAll()
  })

  describe('app usage', function () {
    it('shows usage for metered addons', async function () {
      const app = 'myapp'
      const usage = {
        addons: [{
          id: 'redis-123',
          meters: {
            'Data Storage': {
              quantity: 2.5,
            },
            Connections: {
              quantity: 100,
            },
          },
        }],
      }

      nock('https://api.heroku.com')
        .get(`/apps/${app}/usage`)
        .reply(200, usage)

      nock('https://api.heroku.com')
        .get(`/apps/${app}/addons`)
        .reply(200, [redisAddon])

      await runCommand(Cmd, [
        '--app',
        app,
      ])

      const actual = removeAllWhitespace(stdout.output)
      const expectedHeader = removeAllWhitespace(`=== Usage for ⬢ ${app}`)
      const expectedColumnHeader = removeAllWhitespace('Add-on    Meter        Quantity')
      const expected = removeAllWhitespace('redis-123 Data Storage 2.5\nredis-123 Connections  100')

      expect(actual).to.contain(expectedHeader)
      expect(actual).to.contain(expectedColumnHeader)
      expect(actual).to.contain(expected)
    })

    it('handles apps with no usage', async function () {
      const app = 'myapp'
      const usage = {
        addons: [],
      }

      nock('https://api.heroku.com')
        .get(`/apps/${app}/usage`)
        .reply(200, usage)

      nock('https://api.heroku.com')
        .get(`/apps/${app}/addons`)
        .reply(200, [])

      await runCommand(Cmd, [
        '--app',
        app,
      ])

      expectOutput(stdout.output, `No usage found for app ⬢ ${app}`)
    })
  })

  describe('team usage', function () {
    it('shows usage for team apps with metered addons', async function () {
      const team = 'myteam'
      const app1 = 'app1'
      const app2 = 'app2'
      const usage = {
        apps: [{
          id: app1,
          addons: [{
            id: 'redis-123',
            meters: {
              'Data Storage': {
                quantity: 2.5,
              },
            },
          }],
        }, {
          id: app2,
          addons: [{
            id: 'redis-456',
            meters: {
              'Data Storage': {
                quantity: 5,
              },
            },
          }],
        }],
      }

      const teamAddons = [
        {...redisAddon, id: 'redis-1', name: 'redis-123', app: {id: app1, name: 'App One'}},
        {...redisAddon, id: 'redis-2', name: 'redis-456', app: {id: app2, name: 'App Two'}},
      ]

      nock('https://api.heroku.com')
        .get(`/teams/${team}/usage`)
        .reply(200, usage)

      nock('https://api.heroku.com')
        .get(`/teams/${team}/addons`)
        .reply(200, teamAddons)

      await runCommand(Cmd, [
        '--team',
        team,
      ])

      const actual = removeAllWhitespace(stdout.output)
      const expectedHeaderOne = removeAllWhitespace('=== Usage for ⬢ App One')
      const expectedColumnHeader = removeAllWhitespace('Add-on    Meter        Quantity')
      const expectedOne = removeAllWhitespace('redis-123 Data Storage 2.5')
      const expectedHeaderTwo = removeAllWhitespace('=== Usage for ⬢ App Two')
      const expectedTwo = removeAllWhitespace('redis-456 Data Storage 5')

      expect(actual).to.contain(expectedHeaderOne)
      expect(actual).to.contain(expectedColumnHeader)
      expect(actual).to.contain(expectedOne)
      expect(actual).to.contain(expectedHeaderTwo)
      expect(actual).to.contain(expectedTwo)
    })

    it('handles teams with no usage', async function () {
      const team = 'myteam'
      const usage = {
        apps: [],
      }

      nock('https://api.heroku.com')
        .get(`/teams/${team}/usage`)
        .reply(200, usage)

      nock('https://api.heroku.com')
        .get(`/teams/${team}/addons`)
        .reply(200, [])

      await runCommand(Cmd, [
        '--team',
        team,
      ])

      expectOutput(stdout.output, `No usage found for team ${team}`)
    })
  })
})
