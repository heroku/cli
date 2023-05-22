import {expect, test} from '@oclif/test'

describe('domains:info', () => {
  const domainInfoResponse = {
    acm_status: 'pending',
    acm_status_reason: 'Failing CCA check',
    app: {
      name: 'myapp',
      id: '01234567-89ab-cdef-0123-456789abcdef',
    },
    cname: 'example.herokudns.com',
    created_at: '2012-01-01T12:00:00Z',
    hostname: 'www.example.com',
    id: '01234567-89ab-cdef-0123-456789abcdef',
    kind: 'custom',
    updated_at: '2012-01-01T12:00:00Z',
    status: 'pending',
  }

  test
    .nock('https://api.heroku.com', api => api
      .get('/apps/myapp/domains/www.example.com')
      .reply(200, domainInfoResponse),
    )
    .stdout()
    .command(['domains:info', 'www.example.com', '--app', 'myapp'])
    .it('shows detailed information about a domain', ctx => {
      expect(ctx.stdout).to.contain('acm_status:        pending')
      expect(ctx.stdout).to.contain('acm_status_reason: Failing CCA check')
      expect(ctx.stdout).to.contain('app:               myapp')
      expect(ctx.stdout).to.contain('cname:             example.herokudns.com')
      expect(ctx.stdout).to.contain('created_at:        2012-01-01T12:00:00Z')
      expect(ctx.stdout).to.contain('hostname:          www.example.com')
      expect(ctx.stdout).to.contain('kind:              custom')
      expect(ctx.stdout).to.contain('status:            pending')
      expect(ctx.stdout).to.contain('updated_at:        2012-01-01T12:00:00Z')
    })
})
