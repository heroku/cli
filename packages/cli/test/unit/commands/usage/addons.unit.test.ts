import {stdout} from 'stdout-stderr'
import Cmd from '../../../../src/commands/usage/addons'
import * as nock from 'nock'
import expectOutput from '../../../helpers/utils/expectOutput'
import heredoc from 'tsheredoc'
import runCommand from '../../../helpers/runCommand'
import * as fixtures from '../../../fixtures/addons/fixtures'
import * as Heroku from '@heroku-cli/schema'

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

      expectOutput(stdout.output, heredoc(`
        === Usage for ⬢ ${app}
         Add-on     Meter        Quantity
         ───────── ──────────── ────────
         redis-123 Data Storage 2.5
         redis-123 Connections  100
      `))
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

      expectOutput(stdout.output, heredoc(`
        === Usage for ⬢ App One
         Add-on     Meter        Quantity
         ───────── ──────────── ────────
         redis-123 Data Storage 2.5

        === Usage for ⬢ App Two
         Add-on     Meter        Quantity
         ───────── ──────────── ────────
         redis-456 Data Storage 5
      `))
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
