import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

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
  let api: nock.Scope
  let metricsApi: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    metricsApi = nock('https://api.metrics.herokai.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('shows no errors', async function () {
    api
      .get(`/apps/${APP}/formation`)
      .reply(200, formation)

    metricsApi
      .get(`/apps/${APP}/router-metrics/errors`)
      .query(params => params.process_type === 'web' && params.step === '1h')
      .reply(200, {data: {}})
      .get(`/apps/${APP}/formation/node/metrics/errors`)
      .query(params => params.step === '1h')
      .reply(200, {data: {}})
      .get(`/apps/${APP}/formation/web/metrics/errors`)
      .query(params => params.step === '1h')
      .reply(200, {data: {}})

    const {stderr, stdout} = await runCommand(['apps:errors', '--app', APP])

    expect(stdout).to.equal('No errors on ⬢ myapp in the last 24 hours\n')
    expect(stderr).to.be.equal('')
  })

  it('traps bad request', async function () {
    api
      .get(`/apps/${APP}/formation`)
      .reply(200, formation)

    metricsApi
      .get(`/apps/${APP}/router-metrics/errors`)
      .query(params => params.process_type === 'web' && params.step === '1h')
      .reply(200, {data: {}})
      .get(`/apps/${APP}/formation/node/metrics/errors`)
      .query(params => params.step === '1h')
      .reply(200, {data: {}})
      .get(`/apps/${APP}/formation/web/metrics/errors`)
      .query(params => params.step === '1h')
      .reply(400, {id: 'bad_request', message: 'invalid process_type provided (valid examples: web, worker, etc); '})

    const {stderr, stdout} = await runCommand(['apps:errors', '--app', APP])

    expect(stdout).to.equal('No errors on ⬢ myapp in the last 24 hours\n')
    expect(stderr).to.be.equal('')
  })

  it('propagates other bad request', async function () {
    const ERROR_MESSAGE = 'ack!'

    api
      .get(`/apps/${APP}/formation`)
      .reply(200, formation)

    metricsApi
      .get(`/apps/${APP}/router-metrics/errors`)
      .query(params => params.process_type === 'web' && params.step === '1h')
      .reply(200, {data: {}})
      .get(`/apps/${APP}/formation/node/metrics/errors`)
      .query(params => params.step === '1h')
      .reply(200, {data: {}})
      .get(`/apps/${APP}/formation/web/metrics/errors`)
      .query(params => params.step === '1h')
      .reply(400, {id: 'bad_request', message: ERROR_MESSAGE})

    const {error} = await runCommand(['apps:errors', '--app', APP])

    expect(error?.message).to.include(ERROR_MESSAGE)
  })

  it('shows errors', async function () {
    api
      .get(`/apps/${APP}/formation`)
      .reply(200, formation)

    metricsApi
      .get(`/apps/${APP}/router-metrics/errors`)
      .query(params => params.process_type === 'web' && params.step === '1h')
      .reply(200, errors.router)
      .get(`/apps/${APP}/formation/node/metrics/errors`)
      .query(params => params.step === '1h')
      .reply(200, {data: {}})
      .get(`/apps/${APP}/formation/web/metrics/errors`)
      .query(params => params.step === '1h')
      .reply(200, {data: {R14: [1]}})

    const {stderr, stdout} = await runCommand(['apps:errors', '--app', APP])

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
    api
      .get(`/apps/${APP}/formation`)
      .reply(200, formation)

    metricsApi
      .get(`/apps/${APP}/router-metrics/errors`)
      .query(params => params.process_type === 'web' && params.step === '1h')
      .reply(200, errors.router)
      .get(`/apps/${APP}/formation/node/metrics/errors`)
      .query(params => params.step === '1h')
      .reply(200, {data: {}})
      .get(`/apps/${APP}/formation/web/metrics/errors`)
      .query(params => params.step === '1h')
      .reply(200, {data: {}})

    const {stderr, stdout} = await runCommand(['apps:errors', '--app', APP, '--json'])

    expect(JSON.parse(stdout).router.H12).to.equal(2)
    expect(stderr).to.be.equal('')
  })
})
