import {expect, test} from '../../test'

describe('domains:add', () => {
  const domainsResponse = {
    acm_status: null,
    acm_status_reason: null,
    app: {
      name: 'myapp',
      id: '01234567-89ab-cdef-0123-456789abcdef'
    },
    cname: null,
    created_at: '2012-01-01T12:00:00Z',
    hostname: 'example.com',
    id: '01234567-89ab-cdef-0123-456789abcdef',
    kind: 'custom',
    updated_at: '2012-01-01T12:00:00Z',
    status: 'pending'
  }

  test
    .stderr()
    .nock('https://api.heroku.com', api => api
      .post('/apps/myapp/domains', {hostname: 'example.com'})
      .reply(200, domainsResponse)
    )
    .command(['domains:add', 'example.com', '--app', 'myapp'])
    .it('adds the domain to the app', ctx => {
      expect(ctx.stderr).to.contain('Adding example.com to myapp... done')
    })
})
