import {expect, test} from '@oclif/test'

describe('domains:update', () => {
  const responseBody = {
    acm_status: null,
    acm_status_reason: null,
    app: {id: '9b688aae-2873-419a-9ec6-f4076d945436', name: 'multi-sni-testing'},
    cname: 'powerful-quail-4c0079v4aa19q90x6kz2m7qk.herokudns.com',
    created_at: '2019-12-10T17:53:01Z',
    hostname: 'example.com',
    id: '7ac15e30-6460-48e1-919a-e794bf3512ac',
    kind: 'custom',
    status: 'succeeded',
    sni_endpoint: {
      id: '8cae023a-d8f1-4aca-9929-e516dc011694',
    },
  }

  test
    .stderr()
    .nock('https://api.heroku.com', api => api
      .patch('/apps/myapp/domains/example.com', {sni_endpoint: 'sniendpoint-id'})
      .reply(200, responseBody),
    )
    .command(['domains:update', 'example.com', '--cert', 'sniendpoint-id', '--app', 'myapp'])
    .it('updates the domain to use a different certificate', ctx => {
      expect(ctx.stderr).to.contain('Updating example.com to use sniendpoint-id certificate... done')
    })
})
