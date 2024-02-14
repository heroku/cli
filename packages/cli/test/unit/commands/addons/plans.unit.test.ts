import {stdout} from 'stdout-stderr'
import Cmd from '../../../../src/commands/addons/plans'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import * as fixtures from '../../../fixtures/addons/fixtures'
import expectOutput from '../../../helpers/utils/expectOutput'

describe('addons:plans', function () {
  beforeEach(function () {
    const plans = [
      fixtures.plans['heroku-postgresql:mini'],
      fixtures.plans['heroku-postgresql:standard-2'],
      fixtures.plans['heroku-postgresql:premium-3'],
      fixtures.plans['heroku-postgresql:private-4'],
    ]
    nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
      .get('/addon-services/daservice/plans')
      .reply(200, plans)
  })
  it('shows add-on plans', async function () {
    await runCommand(Cmd, ['daservice'])
    expectOutput(stdout.output, `
         slug                           name         price          max price
───────  ─────────────────────────────  ──────────   ─────────────  ──────────
default  heroku-postgresql:mini         Mini         ~$0.007/hour   $5/month
         heroku-postgresql:standard-2   Standard 2   ~$0.278/hour   $200/month
         heroku-postgresql:premium-3    Premium 3    ~$1.042/hour   $750/month
         heroku-postgresql:private-4    Private 4    ~$2.083/hour   $1500/month`)
  })
})
