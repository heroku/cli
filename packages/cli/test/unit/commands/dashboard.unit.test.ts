import {stdout, stderr} from 'stdout-stderr'
import Cmd  from '../../../src/commands/dashboard'
import runCommand from '../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import {ago} from '../../../src/lib/time'
import {unwrap} from '../../helpers/utils/unwrap'
import * as os from 'os'
import heredoc from 'tsheredoc'
import * as sinon from 'sinon'

describe('dashboard', function () {
  if (os.platform() === 'win32') {
    it('does not run on Windows', () => expect(true))
    return
  }

  let clock: any
  let now: Date
  beforeEach(() => {
    clock = sinon.useFakeTimers({
      now: new Date(2024, 1, 1, 0, 0),
      shouldAdvanceTime: true,
      toFake: ['Date'],
    })
    now = new Date()
  })

  this.afterEach(() => {
    clock.restore()
  })

  const pipeline = {pipeline: {name: 'foobar'}}
  const formation = [
    {command: 'rails s -p $PORT', quantity: 1, size: 'Standard-1X', type: 'web'}, {command: 'npm start', quantity: 0, size: 'Standard-1X', type: 'node'},
  ]
  const router = {
    latency: {
      start_time: '2016-04-17T20:00:00Z', end_time: '2016-04-18T20:00:00Z', step: '1h0m0s', data: {
        'latency.ms.p50': [46.924528301886795, 56.10526315789474, 41.19642857142857, 60.388888888888886, 54.94642857142857, 59.160714285714285, 45.24528301886792, 54.592592592592595, 43.51851851851852, 55, 44.160714285714285, 31.181818181818183, 36.089285714285715, 43.98275862068966, 49.74545454545454, 41.73684210526316, 46.70909090909091, 29.616666666666667, 40.610169491525426, 39.610169491525426, 47.35, 63.833333333333336, 51.1, 44.68333333333333, 32], 'latency.ms.p95': [148.58490566037736, 157.1578947368421, 139.75, 145.75925925925927, 209.30357142857142, 312.80357142857144, 119.56603773584905, 179.05555555555554, 171.62962962962962, 354.55357142857144, 181.17857142857142, 156.52727272727273, 172.89285714285714, 185.6206896551724, 141.96363636363637, 157.94736842105263, 177.0909090909091, 196.51666666666668, 227.25423728813558, 223.15254237288136, 329.8333333333333, 221.33333333333334, 189.7, 159.93333333333334, 238],
      },
    }, status: {
      start_time: '2016-04-17T20:00:00Z', end_time: '2016-04-18T20:00:00Z', step: '1h0m0s', data: {
        200: [null, null, null, null, null, null, null, 1, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], 201: [192, 197, 157, 143, 155, 178, 130, 178, 130, 146, 147, 522, 195, 198, 166, 187, 225, 330, 291, 328, 268, 283, 284, 285, 10],
      },
    }, errors: {
      start_time: '2016-04-17T19:00:00Z', end_time: '2016-04-18T19:00:00Z', step: '1h0m0s', data: {
        H12: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 1, null, null, 1, null, null, null], H25: [null, null, null, null, 1, null, null, 1, null, null, null, null, 1, null, null, null, null, null, null, null, null, null, null, null, null], H27: [null, null, null, null, null, null, null, null, null, 1, 1, null, null, null, null, null, null, null, null, 4, null, null, null, 3, null],
      },
    },
  }

  describe('with no favorites', () => {
    it('shows the dashboard', async () => {
      nock('https://particleboard.heroku.com:443')
        .get('/favorites?type=app')
        .reply(200, [])
      nock('https://api.heroku.com:443')
        .get('/teams')
        .reply(200, [])
      nock('https://telex.heroku.com:443')
        .get('/user/notifications')
        .reply(200, [])

      await runCommand(Cmd)
      expect(stdout.output).to.contain(heredoc(`
        See all add-ons with heroku addons
        See all apps with heroku apps --all
        
        See other CLI commands with heroku help
      `))
      expect(unwrap(stderr.output)).to.contain('Loading... doneWarning: Add apps to this dashboard by favoriting them with heroku apps:favorites:add\n')
    })
  })

  describe('with no telex', () => {
    it('shows the dashboard', async () => {
      nock('https://particleboard.heroku.com:443')
        .get('/favorites?type=app')
        .reply(200, [])
      nock('https://api.heroku.com:443')
        .get('/teams')
        .reply(200, [])
      nock('https://telex.heroku.com:443')
        .get('/user/notifications')
        .reply(401, [])

      await runCommand(Cmd, [])
      expect(stdout.output).to.contain(heredoc(`
        See all add-ons with heroku addons
        See all apps with heroku apps --all
        
        See other CLI commands with heroku help
      `))
      expect(unwrap(stderr.output)).to.contain('Loading... doneWarning: Add apps to this dashboard by favoriting them with heroku apps:favorites:add\n')
    })
  })

  describe('with notifications', () => {
    it('shows the dashboard', async () => {
      nock('https://particleboard.heroku.com:443')
        .get('/favorites?type=app')
        .reply(200, [])
      nock('https://api.heroku.com:443')
        .get('/teams')
        .reply(200, [])
      nock('https://telex.heroku.com:443')
        .get('/user/notifications')
        .reply(200, [{read: false}])
      await runCommand(Cmd, [])
      expect(stdout.output).to.contain(heredoc(`
        See all add-ons with heroku addons
        See all apps with heroku apps --all

        You have 1 unread notifications. Read them with heroku notifications

        See other CLI commands with heroku help
      `))
    })
  })

  describe('with a favorite app', () => {
    it('shows the dashboard', async () => {
      nock('https://particleboard.heroku.com:443')
        .get('/favorites?type=app')
        .reply(200, [{resource_name: 'myapp'}])
      nock('https://api.heroku.com:443')
        .get('/teams')
        .reply(200, [])
        .get('/apps/myapp')
        .reply(200, {
          name: 'myapp', owner: {email: 'foo@bar.com'}, released_at: now.toString(),
        })
        .get('/apps/myapp/formation')
        .reply(200, formation)
      nock('https://telex.heroku.com:443')
        .get('/user/notifications')
        .reply(200, [])
      nock('https://api.metrics.herokai.com:443')
        .get('/apps/myapp/router-metrics/status')
        // `.query` calls used below to avoid getting mocked time to match exactly for `start_time` and `end_time`
        .query((params: any) => params.step === '1h' && params.process_type === 'web')
        .reply(200, router.status)
        .get('/apps/myapp/router-metrics/latency')
        .query((params: any) => params.step === '1h' && params.process_type === 'web')
        .reply(200, router.latency)
        .get('/apps/myapp/router-metrics/errors')
        .query((params: any) => params.step === '1h' && params.process_type === 'web')
        .reply(200, router.errors)
        .get('/apps/myapp/formation/node/metrics/errors')
        .query((params: any) => params.step === '1h')
        .reply(200, {data: {}})
        .get('/apps/myapp/formation/web/metrics/errors')
        .query((params: any) => params.step === '1h')
        .reply(200, {data: {}})

      await runCommand(Cmd, [])
      expect(stdout.output).to.contain(heredoc(`
        myapp
          Owner: foo@bar.com
          Dynos: 1 | Standard-1X
          Last release: ${ago(now)}
          Metrics: 46 ms 4 rpm ▂▁▁▆▂▅█▇ last 24 hours rpm
          Errors: 2 H12, 3 H25, 9 H27 (see details with heroku apps:errors)

        See all add-ons with heroku addons
        See all apps with heroku apps --all

        See other CLI commands with heroku help
      `))
      expect(stderr.output).to.contain('Loading... done\n')
    })
  })

  describe('with a apps and metrics', () => {
    it('shows the dashboard', async () => {
      nock('https://particleboard.heroku.com:443')
        .get('/favorites?type=app')
        .reply(200, [{resource_name: 'myapp'}])
      nock('https://api.heroku.com:443')
        .get('/teams')
        .reply(200, [])
        .get('/apps/myapp')
        .reply(200, {
          name: 'myapp', owner: {email: 'foo@bar.com'}, released_at: now.toString(),
        })
        .get('/apps/myapp/formation')
        .reply(200, formation)
        .get('/apps/myapp/pipeline-couplings')
        .reply(200, pipeline)
      nock('https://telex.heroku.com:443')
        .get('/user/notifications')
        .reply(200, [])
      nock('https://api.metrics.herokai.com:443')
        .get('/apps/myapp/router-metrics/status')
        // `.query` calls used below to avoid getting mocked time to match exactly for `start_time` and `end_time`
        .query((params: any) => params.step === '1h' && params.process_type === 'web')
        .reply(200, router.status)
        .get('/apps/myapp/router-metrics/latency')
        .query((params: any) => params.step === '1h' && params.process_type === 'web')
        .reply(200, router.latency)
        .get('/apps/myapp/router-metrics/errors')
        .query((params: any) => params.step === '1h' && params.process_type === 'web')
        .reply(200, router.errors)
        .get('/apps/myapp/formation/node/metrics/errors')
        .query((params: any) => params.step === '1h')
        .reply(200, {data: {}})
        .get('/apps/myapp/formation/web/metrics/errors')
        .query((params: any) => params.step === '1h')
        .reply(200, {data: {}})

      await runCommand(Cmd, [])
      expect(stdout.output).to.include('Pipeline: foobar')
    })
  })
})
