import {stdout} from 'stdout-stderr'
import Cmd from '../../../../src/commands/addons/plans'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import * as fixtures from '../../../fixtures/addons/fixtures'
import expectOutput from '../../../helpers/utils/expectOutput'
import heredoc from 'tsheredoc'

describe('addons:plans', function () {
  context('with non-metered plans', function () {
    beforeEach(function () {
      const plans = [
        fixtures.plans['heroku-postgresql:mini'],
        fixtures.plans['heroku-postgresql:standard-2'],
        fixtures.plans['heroku-postgresql:premium-3'],
        fixtures.plans['heroku-postgresql:private-4'],
      ]
      nock('https://api.heroku.com')
        .get('/addon-services/daservice/plans')
        .reply(200, plans)
    })

    it('shows add-on plans', async function () {
      await runCommand(Cmd, ['daservice'])
      expectOutput(heredoc(stdout.output), heredoc(`
                Slug                         Name       Price        Max price
        ─────── ──────────────────────────── ────────── ──────────── ───────────
        default heroku-postgresql:mini       Mini       ~$0.007/hour $5/month
                heroku-postgresql:standard-2 Standard 2 ~$0.278/hour $200/month
                heroku-postgresql:premium-3  Premium 3  ~$1.042/hour $750/month
                heroku-postgresql:private-4  Private 4  ~$2.083/hour $1500/month
      `))
    })
  })

  context('with metered plans', function () {
    beforeEach(function () {
      const meteredPlans = [
        fixtures.plans['heroku-inference:plan-1'],
        fixtures.plans['heroku-inference:plan-2'],
        fixtures.plans['heroku-inference:plan-3'],
      ]
      nock('https://api.heroku.com')
        .get('/addon-services/metered-service/plans')
        .reply(200, meteredPlans)
    })

    it('formats price for metered usage plans', async function () {
      await runCommand(Cmd, ['metered-service'])
      expectOutput(heredoc(stdout.output), heredoc(`
                Slug                    Name   Price   Max price
        ─────── ─────────────────────── ────── ─────── ──────────────────────────────────────────────────────────
        default heroku-inference:plan-1 Plan 1 metered https://elements.heroku.com/addons/metered-service#pricing
                heroku-inference:plan-2 Plan 2 metered https://elements.heroku.com/addons/metered-service#pricing
                heroku-inference:plan-3 Plan 3 metered https://elements.heroku.com/addons/metered-service#pricing
      `))
    })
  })
})
