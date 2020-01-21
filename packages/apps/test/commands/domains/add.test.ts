import * as inquirer from 'inquirer'

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

  describe('adding a domain without the feature flag on (the old way)', () => {
    test
      .stderr()
      .nock('https://api.heroku.com', (api: any) => api
        .get('/apps/myapp/features/allow-multiple-sni-endpoints')
        .reply(200, {
          enabled: false
        })
        .post('/apps/myapp/domains', {hostname: 'example.com'})
        .reply(200, domainsResponse)
      )
      .command(['domains:add', 'example.com', '--app', 'myapp'])
      .it('adds the domain to the app', ctx => {
        expect(ctx.stderr).to.contain('Adding example.com to myapp... done')
      })
  })

  describe('adding a domain to an app with multiple certs', () => {
    describe('using the --cert flag', () => {
      test
        .stderr()
        .nock('https://api.heroku.com', (api: any) => api
          .get('/apps/myapp/features/allow-multiple-sni-endpoints')
          .reply(200, {
            enabled: true
          })
          .post('/apps/myapp/domains', {
            hostname: 'example.com',
            sni_endpoint: 'my-cert'
          })
          .reply(200, domainsResponse)
        )
        .command(['domains:add', 'example.com', '--app', 'myapp', '--cert', 'my-cert'])
        .it('adds the domain to the app', ctx => {
          expect(ctx.stderr).to.contain('Adding example.com to myapp... done')
        })
    })

    describe('without passing a cert', () => {
      const certsResponse = [
        {
          app: {
            name: 'myapp',
          },
          name: 'cert1',
          displayName: 'Best Cert Ever',
          ssl_cert: {
            cert_domains: ['foo.com', 'bar.com', 'baz.com', 'baq.com', 'blah.com', 'rejairieja.com'],
          },
        },
        {
          app: {
            name: 'myapp',
          },
          name: 'cert2',
          ssl_cert: {
            cert_domains: ['foo.com', 'bar.com', 'baz.com', 'baq.com', 'blah.com', 'rejairieja.com'],
          },
        },
      ]

      test
        .stderr()
        .stub(inquirer, 'prompt', () => {
          return Promise.resolve({cert: 'my-cert'})
        })
        .nock('https://api.heroku.com', (api: any) => api
          .get('/apps/myapp/features/allow-multiple-sni-endpoints')
          .reply(200, {
            enabled: true
          })
          .post('/apps/myapp/domains', {
            hostname: 'example.com',
          })
          .reply(422, {
            id: 'invalid_params',
            message: '\'sni_endpoint\' param is required when adding a domain to an app with multiple SSL certs.'
          })
          .post('/apps/myapp/domains', {
            hostname: 'example.com',
            sni_endpoint: 'my-cert'
          })
          .reply(200, domainsResponse)
          .get('/apps/myapp/sni-endpoints')
          .reply(200, certsResponse)
        )
        .command(['domains:add', 'example.com', '--app', 'myapp'])
        .it('adds the domain to the app', ctx => {
          expect(ctx.stderr).to.contain('Adding example.com to myapp... done')
        })
    })
  })
})
