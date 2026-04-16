import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import os from 'node:os'
import sinon from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../src/commands/dashboard.js'
import {ago} from '../../../src/lib/time.js'
import {unwrap} from '../../helpers/utils/unwrap.js'

const heredoc = tsheredoc.default

describe('dashboard', function () {
  if (os.platform() === 'win32') {
    it('does not run on Windows', function () {
      return expect(true)
    })
    return
  }

  let clock: any
  let now: Date

  beforeEach(function () {
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
    {
      command: 'rails s -p $PORT', quantity: 1, size: 'Standard-1X', type: 'web',
    }, {
      command: 'npm start', quantity: 0, size: 'Standard-1X', type: 'node',
    },
  ]
  const router = {
    errors: {
      data: {
        H12: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 1, null, null, 1, null, null, null], H25: [null, null, null, null, 1, null, null, 1, null, null, null, null, 1, null, null, null, null, null, null, null, null, null, null, null, null], H27: [null, null, null, null, null, null, null, null, null, 1, 1, null, null, null, null, null, null, null, null, 4, null, null, null, 3, null],
      },
      end_time: '2016-04-18T19:00:00Z',
      start_time: '2016-04-17T19:00:00Z', step: '1h0m0s',
    },
    latency: {
      data: {
        'latency.ms.p50': [46.924_528_301_886_795, 56.105_263_157_894_74, 41.196_428_571_428_57, 60.388_888_888_888_886, 54.946_428_571_428_57, 59.160_714_285_714_285, 45.245_283_018_867_92, 54.592_592_592_592_595, 43.518_518_518_518_52, 55, 44.160_714_285_714_285, 31.181_818_181_818_183, 36.089_285_714_285_715, 43.982_758_620_689_66, 49.745_454_545_454_54, 41.736_842_105_263_16, 46.709_090_909_090_91, 29.616_666_666_666_667, 40.610_169_491_525_426, 39.610_169_491_525_426, 47.35, 63.833_333_333_333_336, 51.1, 44.683_333_333_333_33, 32],
        'latency.ms.p95': [148.584_905_660_377_36, 157.157_894_736_842_1, 139.75, 145.759_259_259_259_27, 209.303_571_428_571_42, 312.803_571_428_571_44, 119.566_037_735_849_05, 179.055_555_555_555_54, 171.629_629_629_629_62, 354.553_571_428_571_44, 181.178_571_428_571_42, 156.527_272_727_272_73, 172.892_857_142_857_14, 185.620_689_655_172_4, 141.963_636_363_636_37, 157.947_368_421_052_63, 177.090_909_090_909_1, 196.516_666_666_666_68, 227.254_237_288_135_58, 223.152_542_372_881_36, 329.833_333_333_333_3, 221.333_333_333_333_34, 189.7, 159.933_333_333_333_34, 238],
      }, end_time: '2016-04-18T20:00:00Z', start_time: '2016-04-17T20:00:00Z', step: '1h0m0s',
    },
    status: {
      data: {
        200: [null, null, null, null, null, null, null, 1, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
        201: [192, 197, 157, 143, 155, 178, 130, 178, 130, 146, 147, 522, 195, 198, 166, 187, 225, 330, 291, 328, 268, 283, 284, 285, 10],
      },
      end_time: '2016-04-18T20:00:00Z',
      start_time: '2016-04-17T20:00:00Z',
      step: '1h0m0s',
    },
  }

  describe('with no favorites', function () {
    it('shows the dashboard', async function () {
      nock('https://particleboard.heroku.com:443')
        .get('/favorites?type=app')
        .reply(200, [])
      nock('https://api.heroku.com:443')
        .get('/teams')
        .reply(200, [])
      nock('https://telex.heroku.com:443')
        .get('/user/notifications')
        .reply(200, [])

      const {stderr, stdout} = await runCommand(Cmd)
      expect(stdout).to.contain(heredoc(`
        See all add-ons with heroku addons
        See all apps with heroku apps --all

        See other CLI commands with heroku help
      `))
      expect(unwrap(stderr)).to.contain('Loading... doneWarning: Add apps to this dashboard by favoriting them with heroku apps:favorites:add\n')
    })
  })

  describe('with no telex', function () {
    it('shows the dashboard', async function () {
      nock('https://particleboard.heroku.com:443')
        .get('/favorites?type=app')
        .reply(200, [])
      nock('https://api.heroku.com:443')
        .get('/teams')
        .reply(200, [])
      nock('https://telex.heroku.com:443')
        .get('/user/notifications')
        .reply(401, [])

      const {stderr, stdout} = await runCommand(Cmd, [])
      expect(stdout).to.contain(heredoc(`
        See all add-ons with heroku addons
        See all apps with heroku apps --all

        See other CLI commands with heroku help
      `))
      expect(unwrap(stderr)).to.contain('Loading... doneWarning: Add apps to this dashboard by favoriting them with heroku apps:favorites:add\n')
    })
  })

  describe('with notifications', function () {
    it('shows the dashboard', async function () {
      nock('https://particleboard.heroku.com:443')
        .get('/favorites?type=app')
        .reply(200, [])
      nock('https://api.heroku.com:443')
        .get('/teams')
        .reply(200, [])
      nock('https://telex.heroku.com:443')
        .get('/user/notifications')
        .reply(200, [{read: false}])
      const {stdout} = await runCommand(Cmd, [])
      expect(stdout).to.contain(heredoc(`
        See all add-ons with heroku addons
        See all apps with heroku apps --all

        You have 1 unread notifications. Read them with heroku notifications

        See other CLI commands with heroku help
      `))
    })
  })

  describe('with a favorite app', function () {
    it('shows the dashboard', async function () {
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

      const {stderr, stdout} = await runCommand(Cmd, [])

      expect(stdout).to.contain(heredoc(`
        === ⬢ myapp

          Owner: foo@bar.com
          Dynos: 1 | Standard-1X
          Last release: ${ago(now)}
          Metrics: 46 ms 4 rpm ▂▁▁▆▂▅█▇ last 24 hours rpm
          Errors: 2 H12, 3 H25, 9 H27 (see details with heroku apps:errors)

        See all add-ons with heroku addons
        See all apps with heroku apps --all

        See other CLI commands with heroku help
      `))
      expect(stderr).to.contain('Loading... done\n')
    })
  })

  describe('with a apps and metrics', function () {
    it('shows the dashboard', async function () {
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

      const {stdout} = await runCommand(Cmd, [])
      expect(stdout).to.include('Pipeline: foobar')
    })
  })
})
