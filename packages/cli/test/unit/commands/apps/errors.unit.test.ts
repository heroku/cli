'use strict'
/* globals beforeEach commands */

const nock = require('nock')
const cli = require('heroku-cli-util')
const cmd = commands.find(c => c.topic === 'apps' && c.command === 'errors')
const {expect} = require('chai')

describe('apps:errors', () => {
  beforeEach(() => cli.mockConsole())

  const yesterday = new Date(Date.now() - (24 * 60 * 60 * 1000))
  const now = new Date()
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

  it('shows no errors', () => {
    const heroku = nock('https://api.heroku.com:443')
      .get('/apps/myapp/formation')
      .reply(200, formation)
    const metrics = nock('https://api.metrics.herokai.com:443')
      .get(`/apps/myapp/router-metrics/errors?start_time=${yesterday.toISOString()}&end_time=${now.toISOString()}&step=1h&process_type=web`)
      .reply(200, {data: {}})
      .get(`/apps/myapp/formation/node/metrics/errors?start_time=${yesterday.toISOString()}&end_time=${now.toISOString()}&step=1h`)
      .reply(200, {data: {}})
      .get(`/apps/myapp/formation/web/metrics/errors?start_time=${yesterday.toISOString()}&end_time=${now.toISOString()}&step=1h`)
      .reply(200, {data: {}})

    return cmd.run({app: 'myapp', flags: {json: false}})
      .then(() => expect(cli.stdout, 'to be', `No errors on myapp in the last 24 hours
`))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => metrics.done())
      .then(() => heroku.done())
  })

  it('traps bad request', () => {
    const heroku = nock('https://api.heroku.com:443')
      .get('/apps/myapp/formation')
      .reply(200, formation)
    const metrics = nock('https://api.metrics.herokai.com:443')
      .get(`/apps/myapp/router-metrics/errors?start_time=${yesterday.toISOString()}&end_time=${now.toISOString()}&step=1h&process_type=web`)
      .reply(200, {data: {}})
      .get(`/apps/myapp/formation/node/metrics/errors?start_time=${yesterday.toISOString()}&end_time=${now.toISOString()}&step=1h`)
      .reply(200, {data: {}})
      .get(`/apps/myapp/formation/web/metrics/errors?start_time=${yesterday.toISOString()}&end_time=${now.toISOString()}&step=1h`)
      .reply(400, {id: 'bad_request', message: 'invalid process_type provided (valid examples: web, worker, etc); '})

    return cmd.run({app: 'myapp', flags: {json: false}})
      .then(() => expect(cli.stdout, 'to be', `No errors on myapp in the last 24 hours
`))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => metrics.done())
      .then(() => heroku.done())
  })

  it('propagates other bad request', () => {
    nock('https://api.heroku.com:443')
      .get('/apps/myapp/formation')
      .reply(200, formation)
    nock('https://api.metrics.herokai.com:443')
      .get(`/apps/myapp/router-metrics/errors?start_time=${yesterday.toISOString()}&end_time=${now.toISOString()}&step=1h&process_type=web`)
      .reply(200, {data: {}})
      .get(`/apps/myapp/formation/node/metrics/errors?start_time=${yesterday.toISOString()}&end_time=${now.toISOString()}&step=1h`)
      .reply(200, {data: {}})
      .get(`/apps/myapp/formation/web/metrics/errors?start_time=${yesterday.toISOString()}&end_time=${now.toISOString()}&step=1h`)
      .reply(400, {id: 'bad_request', message: 'ack!'})

    return expect(cmd.run({app: 'myapp', flags: {json: false}})).to.be.rejected
  })

  it('shows errors', () => {
    const heroku = nock('https://api.heroku.com:443')
      .get('/apps/myapp/formation')
      .reply(200, formation)
    const metrics = nock('https://api.metrics.herokai.com:443')
      .get(`/apps/myapp/router-metrics/errors?start_time=${yesterday.toISOString()}&end_time=${now.toISOString()}&step=1h&process_type=web`)
      .reply(200, errors.router)
      .get(`/apps/myapp/formation/node/metrics/errors?start_time=${yesterday.toISOString()}&end_time=${now.toISOString()}&step=1h`)
      .reply(200, {data: {}})
      .get(`/apps/myapp/formation/web/metrics/errors?start_time=${yesterday.toISOString()}&end_time=${now.toISOString()}&step=1h`)
      .reply(200, {data: {R14: [1]}})

    return cmd.run({app: 'myapp', flags: {json: false}})
      .then(() => expect(cli.stdout, 'to be', `=== Errors on myapp in the last 24 hours
source  name  level     desc                        count
──────  ────  ────────  ──────────────────────────  ─────
router  H12   critical  Request Timeout             2
router  H25   critical  HTTP Restriction            3
router  H27   info      Client Request Interrupted  9
web     R14   critical  Memory quota exceeded       1
`))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => metrics.done())
      .then(() => heroku.done())
  })

  it('shows errors as json', () => {
    const heroku = nock('https://api.heroku.com:443')
      .get('/apps/myapp/formation')
      .reply(200, formation)
    const metrics = nock('https://api.metrics.herokai.com:443')
      .get(`/apps/myapp/router-metrics/errors?start_time=${yesterday.toISOString()}&end_time=${now.toISOString()}&step=1h&process_type=web`)
      .reply(200, errors.router)
      .get(`/apps/myapp/formation/node/metrics/errors?start_time=${yesterday.toISOString()}&end_time=${now.toISOString()}&step=1h`)
      .reply(200, {data: {}})
      .get(`/apps/myapp/formation/web/metrics/errors?start_time=${yesterday.toISOString()}&end_time=${now.toISOString()}&step=1h`)
      .reply(200, {data: {}})

    return cmd.run({app: 'myapp', flags: {json: true}})
      .then(() => expect(JSON.parse(cli.stdout), 'to satisfy', {router: {H12: 2}}))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => metrics.done())
      .then(() => heroku.done())
  })
})
