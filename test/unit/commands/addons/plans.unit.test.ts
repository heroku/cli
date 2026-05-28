import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {stub} from 'sinon'

import Cmd from '../../../../src/commands/addons/plans.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'
import normalizeTableOutput from '../../../helpers/utils/normalize-table-output.js'

describe('addons:plans', function () {
  let sdkMock: MockSDK

  afterEach(function () {
    sdkMock?.restore()
  })

  context('with non-metered plans', function () {
    it('shows add-on plans', async function () {
      const plans = [
        fixtures.plans['heroku-postgresql:mini'],
        fixtures.plans['heroku-postgresql:standard-2'],
        fixtures.plans['heroku-postgresql:premium-3'],
        fixtures.plans['heroku-postgresql:private-4'],
      ]
      const listPlansStub = stub().resolves(plans)
      const fakePlatform = {
        addOn: {listPlans: listPlansStub},
      }
      sdkMock = mockSDKPlatform(fakePlatform)

      const {stdout} = await runCommand(Cmd, ['daservice'])
      const [header, body] = stdout.split(/\s[-─]+\s/gm)
      const actualHeader  = normalizeTableOutput(header)
      const actualBody    = normalizeTableOutput(body)

      const expectedHeader = normalizeTableOutput(`
                Slug                         Name       Price        Max Price`)
      expect(actualHeader).to.eq(expectedHeader)

      const expectedBody = normalizeTableOutput(`
        default heroku-postgresql:mini       Mini       ~$0.007/hour $5/month
                heroku-postgresql:standard-2 Standard 2 ~$0.278/hour $200/month
                heroku-postgresql:premium-3  Premium 3  ~$1.042/hour $750/month
                heroku-postgresql:private-4  Private 4  ~$2.083/hour $1500/month`)
      expect(actualBody).to.eq(expectedBody)
    })
  })

  context('with metered plans', function () {
    it('formats price for metered usage plans', async function () {
      const meteredPlans = [
        fixtures.plans['heroku-inference:plan-1'],
        fixtures.plans['heroku-inference:plan-2'],
        fixtures.plans['heroku-inference:plan-3'],
      ]
      const listPlansStub = stub().resolves(meteredPlans)
      const fakePlatform = {
        addOn: {listPlans: listPlansStub},
      }
      sdkMock = mockSDKPlatform(fakePlatform)

      const {stdout} = await runCommand(Cmd, ['metered-service'])
      const [header, body] = stdout.split(/\s[-─]+\s/gm)
      const actualHeader  = normalizeTableOutput(header)
      const actualBody    = normalizeTableOutput(body)

      const expectedHeader = normalizeTableOutput(`
                Slug                    Name   Price   Max Price`)
      expect(actualHeader).to.eq(expectedHeader)
      const expectedBody = normalizeTableOutput(`
        default heroku-inference:plan-1 Plan 1 metered https://elements.heroku.com/addons/metered-service#pricing
                heroku-inference:plan-2 Plan 2 metered https://elements.heroku.com/addons/metered-service#pricing
                heroku-inference:plan-3 Plan 3 metered https://elements.heroku.com/addons/metered-service#pricing`)
      expect(actualBody).to.eq(expectedBody)
    })
  })
})
