import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'
import {stderr, stdout} from 'stdout-stderr'

import DomainsAdd from '../../../../src/commands/domains/add.js'
import runCommand from '../../../helpers/runCommand.js'

describe('domains:add', function () {
  afterEach(function () {
    nock.cleanAll()
    stdout.stop()
    stderr.stop()
  })

  const domainsResponse = {
    acm_status: null,
    acm_status_reason: null,
    app: {
      id: '01234567-89ab-cdef-0123-456789abcdef',
      name: 'myapp',
    },
    cname: null,
    created_at: '2012-01-01T12:00:00Z',
    hostname: 'example.com',
    id: '01234567-89ab-cdef-0123-456789abcdef',
    kind: 'custom',
    status: 'pending',
    updated_at: '2012-01-01T12:00:00Z',
  }

  describe('adding a domain to an app with multiple certs', function () {
    const domainsResponseWithEndpoint = {
      ...domainsResponse,
      sni_endpoint: {
        name: 'my-cert',
      },
    }

    describe('using the --cert flag', function () {
      it('adds the domain to the app', async function () {
        nock('https://api.heroku.com')
          .post('/apps/myapp/domains', {
            hostname: 'example.com',
            sni_endpoint: 'my-cert',
          })
          .reply(200, domainsResponseWithEndpoint)

        await runCommand(DomainsAdd, ['example.com', '--app', 'myapp', '--cert', 'my-cert'])

        expect(stderr.output).to.contain('Adding example.com to ⬢ myapp... done')
      })
    })

    describe('without passing a cert', function () {
      const certsResponse = [
        {
          app: {
            name: 'myapp',
          },
          displayName: 'Best Cert Ever',
          name: 'cert1',
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

      let promptForCertStub: sinon.SinonStub

      beforeEach(function () {
        promptForCertStub = sinon.stub(DomainsAdd.prototype, 'promptForCert').resolves('my-cert')
      })

      afterEach(function () {
        promptForCertStub.restore()
      })

      it('adds the domain to the app', async function () {
        nock('https://api.heroku.com')
          .post('/apps/myapp/domains', {
            hostname: 'example.com',
            sni_endpoint: 'my-cert',
          })
          .reply(200, domainsResponseWithEndpoint)
          .get('/apps/myapp/sni-endpoints')
          .reply(200, certsResponse)

        await runCommand(DomainsAdd, ['example.com', '--app', 'myapp'])

        expect(stderr.output).to.contain('Adding example.com to ⬢ myapp... done')
      })
    })
  })
})
