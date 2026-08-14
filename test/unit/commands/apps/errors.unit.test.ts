import {APIClient} from '@heroku-cli/command'
import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'

import Errors from '../../../../src/commands/apps/errors.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

type FakeMetrics = {
  formationMetric: {errors: sinon.SinonStub}
  routerMetric: {errors: sinon.SinonStub}
}

type FakePlatform = {
  formation: {list: sinon.SinonStub}
}

function buildFakeMetrics(): FakeMetrics {
  return {
    formationMetric: {errors: sinon.stub()},
    routerMetric: {errors: sinon.stub()},
  }
}

function buildFakePlatform(): FakePlatform {
  return {
    formation: {list: sinon.stub()},
  }
}

const formation = [
  {
    command: 'npm start',
    quantity: 0,
    size: 12,
    type: 'node',
  },
  {
    command: 'rails s -p $PORT',
    quantity: 1,
    size: 12,
    type: 'web',
  },
]
const errors = {
  router: {
    data: {
      H12: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 1, null, null, 1, null, null, null],
      H25: [null, null, null, null, 1, null, null, 1, null, null, null, null, 1, null, null, null, null, null, null, null, null, null, null, null, null],
      H27: [null, null, null, null, null, null, null, null, null, 1, 1, null, null, null, null, null, null, null, null, 4, null, null, null, 3, null],
    },
    end_time: '2016-04-18T19:00:00Z',
    start_time: '2016-04-17T19:00:00Z',
    step: '1h0m0s',
  },
}

const APP = 'myapp'

describe('apps:errors', function () {
  let fakeMetrics: FakeMetrics
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakeMetrics = buildFakeMetrics()
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'metrics').get(() => fakeMetrics)
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('threads the CLI auth token into the SDK client options', async function () {
    // Opt out of the shared platform/metrics getter stubs so the real SDK and
    // its clients run and issue real HTTP requests. The command must forward
    // the CLI-resolved `this.heroku.auth` as `clientOptions.token`, which
    // heroku-fetch turns into the outgoing `Authorization: Bearer <token>`
    // header on every service (platform + metrics share the one client
    // options). Pin `this.heroku.auth` to a sentinel distinct from the test
    // env's HEROKU_API_KEY so this fails if the command drops
    // `clientOptions: {token: this.heroku.auth}` (the SDK would fall back to the
    // env token, flipping the header).
    sinon.restore()
    sinon.stub(APIClient.prototype, 'auth').get(() => 'cli-keychain-token')

    let authHeader: string | undefined
    const platformAPI = nock('https://api.heroku.com:443')
      .get(`/apps/${APP}/formation`)
      .reply(function () {
        authHeader = this.req.headers.authorization as unknown as string
        return [200, formation]
      })
    // The metrics client hits a distinct host; both services derive the bearer
    // token from the same client options, so intercepting them with empty data
    // keeps the run from erroring.
    const metricsAPI = nock('https://api.metrics.heroku.com:443')
      .persist()
      .get(new RegExp(`^/apps/${APP}/`))
      .reply(200, {data: {}})

    await runCommand(Errors, ['--app', APP])

    expect(authHeader).to.equal('Bearer cli-keychain-token')
    platformAPI.done()
    metricsAPI.done()
  })

  it('threads the CLI-resolved API host into the SDK platform client while metrics keeps its own host', async function () {
    // Prove the two-instance split: the platform HerokuSDK is built from
    // sdkClientOptions (which sets baseUrl from vars.apiUrl → honors
    // HEROKU_HOST), while the metrics HerokuSDK gets {token} only and resolves
    // its own host. Point HEROKU_HOST at an allow-listed staging host so the
    // platform call must land on api.staging.herokudev.com, while metrics must
    // stay on api.metrics.heroku.com. nock.disableNetConnect() is active, so a
    // wrong host throws and fails the test either way the split could break.
    const originalHost = process.env.HEROKU_HOST
    process.env.HEROKU_HOST = 'staging.herokudev.com'
    try {
      sinon.restore()
      sinon.stub(APIClient.prototype, 'auth').get(() => 'cli-keychain-token')

      const platformAPI = nock('https://api.staging.herokudev.com:443')
        .get(`/apps/${APP}/formation`)
        .reply(200, formation)
      const metricsAPI = nock('https://api.metrics.heroku.com:443')
        .persist()
        .get(new RegExp(`^/apps/${APP}/`))
        .reply(200, {data: {}})

      await runCommand(Errors, ['--app', APP])

      platformAPI.done()
      expect(metricsAPI.isDone()).to.equal(true)
    } finally {
      if (originalHost === undefined) {
        delete process.env.HEROKU_HOST
      } else {
        process.env.HEROKU_HOST = originalHost
      }
    }
  })

  it('shows no errors', async function () {
    fakePlatform.formation.list.resolves(formation)
    fakeMetrics.routerMetric.errors.resolves({data: {}})
    fakeMetrics.formationMetric.errors.callsFake(async () => ({data: {}}))

    const {stderr, stdout} = await runCommand(Errors, ['--app', APP])

    expect(stdout).to.equal('No errors on ⬢ myapp in the last 24 hours\n')
    expect(stderr).to.be.equal('')

    // Pin the SDK call arguments so a regression that drops process_type,
    // changes the step, or passes the wrong app can't slip through green.
    // start_time/end_time are Date.now()-derived, so match their shape only.
    expect(fakePlatform.formation.list.calledOnceWithExactly(APP)).to.equal(true)
    expect(fakeMetrics.routerMetric.errors.calledWith(
      APP,
      sinon.match({
        end_time: sinon.match.string, process_type: 'web', start_time: sinon.match.string, step: '1h',
      }),
    )).to.equal(true)
    // formationMetric is called per formation type (node, web) with (app, type, opts).
    expect(fakeMetrics.formationMetric.errors.calledWith(
      APP,
      'web',
      sinon.match({end_time: sinon.match.string, start_time: sinon.match.string, step: '1h'}),
    )).to.equal(true)
    expect(fakeMetrics.formationMetric.errors.calledWith(APP, 'node', sinon.match.object)).to.equal(true)
  })

  it('traps bad request', async function () {
    fakePlatform.formation.list.resolves(formation)
    fakeMetrics.routerMetric.errors.resolves({data: {}})
    fakeMetrics.formationMetric.errors.callsFake(async (app: string, type: string) => {
      if (type === 'web') {
        throw Object.assign(new Error('invalid process_type provided (valid examples: web, worker, etc); '), {statusCode: 400})
      }

      return {data: {}}
    })

    const {stderr, stdout} = await runCommand(Errors, ['--app', APP])

    expect(stdout).to.equal('No errors on ⬢ myapp in the last 24 hours\n')
    expect(stderr).to.be.equal('')
  })

  it('propagates other bad request', async function () {
    const ERROR_MESSAGE = 'ack!'

    fakePlatform.formation.list.resolves(formation)
    fakeMetrics.routerMetric.errors.resolves({data: {}})
    fakeMetrics.formationMetric.errors.callsFake(async (app: string, type: string) => {
      if (type === 'web') {
        throw Object.assign(new Error(ERROR_MESSAGE), {statusCode: 400})
      }

      return {data: {}}
    })

    const {error} = await runCommand(Errors, ['--app', APP])

    expect(error?.message).to.include(ERROR_MESSAGE)
  })

  it('shows errors', async function () {
    fakePlatform.formation.list.resolves(formation)
    fakeMetrics.routerMetric.errors.resolves(errors.router)
    fakeMetrics.formationMetric.errors.callsFake(async (app: string, type: string) =>
      (type === 'web' ? {data: {R14: [1]}} : {data: {}}))

    const {stderr, stdout} = await runCommand(Errors, ['--app', APP])

    const actual = removeAllWhitespace(stdout)
    expect(actual).to.include(removeAllWhitespace('Errors on ⬢ myapp in the last 24 hours'))
    expect(actual).to.include(removeAllWhitespace('Source Name Level    Desc                       Count'))
    expect(actual).to.include(removeAllWhitespace('router H12  critical Request Timeout            2'))
    expect(actual).to.include(removeAllWhitespace('router H25  critical HTTP Restriction           3'))
    expect(actual).to.include(removeAllWhitespace('router H27  info     Client Request Interrupted 9'))
    expect(actual).to.include(removeAllWhitespace('web    R14  critical Memory quota exceeded      1'))
    expect(stderr).to.be.equal('')
  })

  it('shows errors as json', async function () {
    fakePlatform.formation.list.resolves(formation)
    fakeMetrics.routerMetric.errors.resolves(errors.router)
    fakeMetrics.formationMetric.errors.callsFake(async () => ({data: {}}))

    const {stderr, stdout} = await runCommand(Errors, ['--app', APP, '--json'])

    expect(JSON.parse(stdout).router.H12).to.equal(2)
    expect(stderr).to.be.equal('')
  })
})
