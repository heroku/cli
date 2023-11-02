import {test, expect} from '@oclif/test'

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
    start_time: '2016-04-17T19:00:00Z',
    end_time: '2016-04-18T19:00:00Z',
    step: '1h0m0s',
    data: {
      H12: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 1, null, null, 1, null, null, null],
      H25: [null, null, null, null, 1, null, null, 1, null, null, null, null, 1, null, null, null, null, null, null, null, null, null, null, null, null],
      H27: [null, null, null, null, null, null, null, null, null, 1, 1, null, null, null, null, null, null, null, null, 4, null, null, null, 3, null],
    },
  },
}

const APP = 'myapp'

describe('apps:errors', () => {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => {
      api
        .get(`/apps/${APP}/formation`)
        .reply(200, formation)
    })
    .nock('https://api.metrics.herokai.com', api => {
      api
        .get(`/apps/${APP}/router-metrics/errors`)
        .query(params => {
          return params.process_type === 'web' && params.step === '1h'
        })
        .reply(200, {data: {}})
        .get(`/apps/${APP}/formation/node/metrics/errors`)
        .query(params => {
          return params.step === '1h'
        })
        .reply(200, {data: {}})
        .get(`/apps/${APP}/formation/web/metrics/errors`)
        .query(params => {
          return params.step === '1h'
        })
        .reply(200, {data: {}})
    })
    .command(['apps:errors', '--app', APP])
    .it('shows no errors', ({stdout, stderr}) => {
      expect(stdout).to.equal('No errors on ⬢ myapp in the last 24 hours\n')
      expect(stderr).to.be.equal('')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => {
      api
        .get(`/apps/${APP}/formation`)
        .reply(200, formation)
    })
    .nock('https://api.metrics.herokai.com', api => {
      api
        .get(`/apps/${APP}/router-metrics/errors`)
        .query(params => {
          return params.process_type === 'web' && params.step === '1h'
        })
        .reply(200, {data: {}})
        .get(`/apps/${APP}/formation/node/metrics/errors`)
        .query(params => {
          return params.step === '1h'
        })
        .reply(200, {data: {}})
        .get(`/apps/${APP}/formation/web/metrics/errors`)
        .query(params => {
          return params.step === '1h'
        })
        .reply(400, {id: 'bad_request', message: 'invalid process_type provided (valid examples: web, worker, etc); '})
    })
    .command(['apps:errors', '--app', APP])
    .it('traps bad request', ({stdout, stderr}) => {
      expect(stdout).to.equal('No errors on ⬢ myapp in the last 24 hours\n')
      expect(stderr).to.be.equal('')
    })

  const ERROR_MESSAGE = 'ack!'
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => {
      api
        .get(`/apps/${APP}/formation`)
        .reply(200, formation)
    })
    .nock('https://api.metrics.herokai.com', api => {
      api
        .get(`/apps/${APP}/router-metrics/errors`)
        .query(params => {
          return params.process_type === 'web' && params.step === '1h'
        })
        .reply(200, {data: {}})
        .get(`/apps/${APP}/formation/node/metrics/errors`)
        .query(params => {
          return params.step === '1h'
        })
        .reply(200, {data: {}})
        .get(`/apps/${APP}/formation/web/metrics/errors`)
        .query(params => {
          return params.step === '1h'
        })
        .reply(400, {id: 'bad_request', message: ERROR_MESSAGE})
    })
    .command(['apps:errors', '--app', APP])
    .catch((error: any) => {
      expect(error.message).to.include(ERROR_MESSAGE)
    })
    .it('propagates other bad request')

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => {
      api
        .get(`/apps/${APP}/formation`)
        .reply(200, formation)
    })
    .nock('https://api.metrics.herokai.com', api => {
      api
        .get(`/apps/${APP}/router-metrics/errors`)
        .query(params => {
          return params.process_type === 'web' && params.step === '1h'
        })
        .reply(200, errors.router)
        .get(`/apps/${APP}/formation/node/metrics/errors`)
        .query(params => {
          return params.step === '1h'
        })
        .reply(200, {data: {}})
        .get(`/apps/${APP}/formation/web/metrics/errors`)
        .query(params => {
          return params.step === '1h'
        })
        .reply(200, {data: {R14: [1]}})
    })
    .command(['apps:errors', '--app', APP])
    .it('traps bad request', ({stdout, stderr}) => {
      expect(stdout).to.include('=== Errors on ⬢ myapp in the last 24 hours')
      expect(stdout).to.include('Source Name Level    desc                       Count')
      expect(stdout).to.include('────── ──── ──────── ────────────────────────── ─────')
      expect(stdout).to.include('router H12  critical Request Timeout            2')
      expect(stdout).to.include('router H25  critical HTTP Restriction           3')
      expect(stdout).to.include('router H27  info     Client Request Interrupted 9')
      expect(stdout).to.include('web    R14  critical Memory quota exceeded      1')
      expect(stderr).to.be.equal('')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => {
      api
        .get(`/apps/${APP}/formation`)
        .reply(200, formation)
    })
    .nock('https://api.metrics.herokai.com', api => {
      api
        .get(`/apps/${APP}/router-metrics/errors`)
        .query(params => {
          return params.process_type === 'web' && params.step === '1h'
        })
        .reply(200, errors.router)
        .get(`/apps/${APP}/formation/node/metrics/errors`)
        .query(params => {
          return params.step === '1h'
        })
        .reply(200, {data: {}})
        .get(`/apps/${APP}/formation/web/metrics/errors`)
        .query(params => {
          return params.step === '1h'
        })
        .reply(200, {data: {}})
    })
    .command(['apps:errors', '--app', APP, '--json'])
    .it('shows errors as json', ({stdout, stderr}) => {
      expect(JSON.parse(stdout).router.H12).to.equal(2)
      expect(stderr).to.be.equal('')
    })
})
