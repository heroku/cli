import * as Heroku from '@heroku-cli/schema'
import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../src/commands/usage/addons.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

type FakePlatform = {
  addOn: {listByApp: sinon.SinonStub; listByTeam: sinon.SinonStub}
  usage: {forApp: sinon.SinonStub; forTeamApp: sinon.SinonStub; infoGet: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    addOn: {listByApp: sinon.stub(), listByTeam: sinon.stub()},
    usage: {forApp: sinon.stub(), forTeamApp: sinon.stub(), infoGet: sinon.stub()},
  }
}

describe('usage:addons', function () {
  let redisAddon: Heroku.AddOn
  let fakePlatform: FakePlatform

  beforeEach(function () {
    redisAddon = fixtures.addons['www-redis']
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  describe('app usage', function () {
    it('shows usage for metered addons', async function () {
      const app = 'myapp'
      const usage = {
        addons: [{
          id: 'redis-123',
          /* eslint-disable perfectionist/sort-objects */
          meters: {
            'Data Storage': {
              quantity: 2.5,
            },
            Connections: {
              quantity: 100,
            },
          },
          /* eslint-enable perfectionist/sort-objects */
        }],
      }

      fakePlatform.usage.forApp.resolves(usage)
      fakePlatform.addOn.listByApp.resolves([redisAddon])

      const {stdout} = await runCommand(Cmd, [
        '--app',
        app,
      ])

      const actual = removeAllWhitespace(stdout)
      const expectedHeader = removeAllWhitespace(`=== Usage for ⬢ ${app}`)
      const expectedColumnHeader = removeAllWhitespace('Add-on    Meter        Quantity')
      const expected = removeAllWhitespace('redis-123 Data Storage 2.5\nredis-123 Connections  100')

      expect(actual).to.contain(expectedHeader)
      expect(actual).to.contain(expectedColumnHeader)
      expect(actual).to.contain(expected)
      expect(fakePlatform.usage.forApp.calledOnceWithExactly(app)).to.equal(true)
      expect(fakePlatform.addOn.listByApp.calledOnceWithExactly(app)).to.equal(true)
    })

    it('handles apps with no usage', async function () {
      const app = 'myapp'

      fakePlatform.usage.forApp.resolves({addons: []})
      fakePlatform.addOn.listByApp.resolves([])

      const {stdout} = await runCommand(Cmd, [
        '--app',
        app,
      ])

      expectOutput(stdout, `No usage found for app ⬢ ${app}`)
    })
  })

  describe('team app usage', function () {
    it('shows usage for a single team app', async function () {
      const team = 'myteam'
      const app = 'myapp'
      const usage = {
        addons: [{
          id: 'redis-123',
          meters: {
            'Data Storage': {
              quantity: 2.5,
            },
          },
        }],
      }

      fakePlatform.usage.forTeamApp.resolves(usage)
      fakePlatform.addOn.listByApp.resolves([redisAddon])

      const {stdout} = await runCommand(Cmd, [
        '--app',
        app,
        '--team',
        team,
      ])

      const actual = removeAllWhitespace(stdout)
      const expectedHeader = removeAllWhitespace(`=== Usage for ⬢ ${app}`)
      const expected = removeAllWhitespace('redis-123 Data Storage 2.5')

      expect(actual).to.contain(expectedHeader)
      expect(actual).to.contain(expected)
      expect(fakePlatform.usage.forTeamApp.calledOnceWithExactly(team, app)).to.equal(true)
      expect(fakePlatform.addOn.listByApp.calledOnceWithExactly(app)).to.equal(true)
    })
  })

  describe('team usage', function () {
    it('shows usage for team apps with metered addons', async function () {
      const team = 'myteam'
      const app1 = 'app1'
      const app2 = 'app2'
      const usage = {
        apps: [{
          addons: [{
            id: 'redis-123',
            meters: {
              'Data Storage': {
                quantity: 2.5,
              },
            },
          }],
          id: app1,
        }, {
          addons: [{
            id: 'redis-456',
            meters: {
              'Data Storage': {
                quantity: 5,
              },
            },
          }],
          id: app2,
        }],
      }

      const teamAddons = [
        {
          ...redisAddon, app: {id: app1, name: 'App One'}, id: 'redis-1', name: 'redis-123',
        },
        {
          ...redisAddon, app: {id: app2, name: 'App Two'}, id: 'redis-2', name: 'redis-456',
        },
      ]

      fakePlatform.usage.infoGet.resolves(usage)
      fakePlatform.addOn.listByTeam.resolves(teamAddons)

      const {stdout} = await runCommand(Cmd, [
        '--team',
        team,
      ])

      const actual = removeAllWhitespace(stdout)
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
      expect(fakePlatform.usage.infoGet.calledOnceWithExactly(team)).to.equal(true)
      expect(fakePlatform.addOn.listByTeam.calledOnceWithExactly(team)).to.equal(true)
    })

    it('handles teams with no usage', async function () {
      const team = 'myteam'

      fakePlatform.usage.infoGet.resolves({apps: []})
      fakePlatform.addOn.listByTeam.resolves([])

      const {stdout} = await runCommand(Cmd, [
        '--team',
        team,
      ])

      expectOutput(stdout, `No usage found for team ${team}`)
    })
  })
})
