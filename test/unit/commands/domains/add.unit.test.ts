import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import DomainsAdd from '../../../../src/commands/domains/add.js'

type FakePlatform = {
  domain: {add: SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    domain: {add: stub()},
  }
}

describe('domains:add', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    restore()
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
        fakePlatform.domain.add.resolves(domainsResponseWithEndpoint)

        const {stderr} = await runCommand(DomainsAdd, ['example.com', '--app', 'myapp', '--cert', 'my-cert'])
        expect(stderr).to.contain('Adding example.com to ⬢ myapp... done')
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

      let promptForCertStub: SinonStub

      beforeEach(function () {
        promptForCertStub = stub(DomainsAdd.prototype, 'promptForCert').resolves('my-cert')
      })

      afterEach(function () {
        promptForCertStub.restore()
      })

      it('adds the domain to the app', async function () {
        fakePlatform.domain.add.resolves(domainsResponseWithEndpoint)

        const {stderr} = await runCommand(DomainsAdd, ['example.com', '--app', 'myapp'])
        expect(stderr).to.contain('Adding example.com to ⬢ myapp... done')
      })
    })
  })
})
