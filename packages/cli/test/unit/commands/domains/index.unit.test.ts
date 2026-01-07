import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'
import {stderr, stdout} from 'stdout-stderr'

import DomainsIndex from '../../../../src/commands/domains/index.js'
import runCommand from '../../../helpers/runCommand.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'
import {unwrap} from '../../../helpers/utils/unwrap.js'

describe('domains', function () {
  beforeEach(function () {
    confirmStub = sinon.stub(DomainsIndex.prototype, 'confirmDisplayAllDomains').resolves(true)
  })

  afterEach(function () {
    confirmStub.restore()
    nock.cleanAll()
    stdout.stop()
    stderr.stop()
  })

  const herokuOnlyDomainsResponse = [{
    acm_status: null,
    acm_status_reason: null,
    app: {
      id: '01234567-89ab-cdef-0123-456789abcdef',
      name: 'myapp',
    },
    cname: null,
    created_at: '2012-01-01T12:00:00Z',
    hostname: 'myapp.herokuapp.com',
    id: '01234567-89ab-cdef-0123-456789abcdef',
    kind: 'heroku',
    status: 'pending',
    updated_at: '2012-01-01T12:00:00Z',
  }]

  const herokuAndCustomDomainsResponse = [
    ...herokuOnlyDomainsResponse,
    {
      acm_status: 'failing',
      acm_status_reason: 'Failing CCA check',
      app: {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'myapp',
      },
      cname: 'foo.herokudns.com',
      created_at: '2012-01-01T12:00:00Z',
      hostname: 'example.com',
      id: '11434567-89ab-cdef-0123-456789abcdef',
      kind: 'custom',
      status: 'succeeded',
      updated_at: '2012-01-01T12:00:00Z',
    },
    {
      acm_status: 'failing',
      acm_status_reason: 'Failing CCA check',
      app: {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'myapp',
      },
      cname: 'bar.herokudns.com',
      created_at: '2012-01-01T12:00:00Z',
      hostname: 'www.example.com',
      id: '11234567-89ab-cdef-0123-456789abcdef',
      kind: 'custom',
      status: 'succeeded',
      updated_at: '2012-01-01T12:00:00Z',
    },
    {
      acm_status: 'failing',
      acm_status_reason: 'Failing CCA check',
      app: {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'myapp',
      },
      cname: 'buzz.herokudns.com',
      created_at: '2012-01-01T12:00:00Z',
      hostname: '*.example.com',
      id: '12234567-89ab-cdef-0123-456789abcdef',
      kind: 'custom',
      status: 'succeeded',
      updated_at: '2012-01-01T12:00:00Z',
    },
  ]

  const herokuDomainWithSniEndpoint = [
    {
      acm_status: 'failing',
      acm_status_reason: 'Failing CCA check',
      app: {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'myapp',
      },
      cname: 'buzz.herokudns.com',
      created_at: '2012-01-01T12:00:00Z',
      hostname: '*.example.com',
      id: '12234567-89ab-cdef-0123-456789abcdef',
      kind: 'custom',
      sni_endpoint: {
        id: 1,
        name: 'some haiku',
      },
      status: 'succeeded',
      updated_at: '2012-01-01T12:00:00Z',
    },
  ]

  let confirmStub: sinon.SinonStub

  it('does not show the custom domain header if there are no custom domains', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/domains')
      .reply(200, herokuOnlyDomainsResponse)

    await runCommand(DomainsIndex, ['--app', 'myapp'])

    expect(stdout.output).to.contain('=== myapp Heroku Domain\n\nmyapp.herokuapp.com')
    expect(stdout.output).to.contain('myapp.herokuapp.com')
    expect(stdout.output).to.not.contain('=== myapp Custom Domains')
  })

  it('shows a list of domains and their DNS targets when there are custom domains', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/domains')
      .reply(200, herokuAndCustomDomainsResponse)

    await runCommand(DomainsIndex, ['--app', 'myapp'])

    const actual = removeAllWhitespace(stdout.output)
    expect(stdout.output).to.contain('=== myapp Heroku Domain\n\nmyapp.herokuapp.com')
    expect(stdout.output).to.contain('myapp.herokuapp.com')
    expect(stdout.output).to.contain('=== myapp Custom Domains')
    expect(actual).to.contain(removeAllWhitespace('Domain Name     DNS Record Type DNS Target'))
    expect(actual).to.contain(removeAllWhitespace('example.com     ALIAS or ANAME  foo.herokudns.com'))
    expect(actual).to.contain(removeAllWhitespace('www.example.com CNAME           bar.herokudns.com'))
    expect(actual).to.contain(removeAllWhitespace('*.example.com   CNAME           buzz.herokudns.com'))
  })

  it('shows the SNI endpoint column when multiple sni endpoints are enabled', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/domains')
      .reply(200, herokuDomainWithSniEndpoint)

    await runCommand(DomainsIndex, ['--app', 'myapp'])

    const actual = removeAllWhitespace(stdout.output)
    expect(actual).to.contain(removeAllWhitespace('Domain Name   DNS Record Type DNS Target         SNI Endpoint'))
    expect(actual).to.contain(removeAllWhitespace('*.example.com CNAME           buzz.herokudns.com some haiku'))
  })

  it('shows warning message for over 100 domains', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/domains')
      .reply(200, () => {
        const domainData = {
          acm_status: null,
          acm_status_reason: null,
          app: {
            id: '01234567-89ab-cdef-0123-456789abcdef',
            name: 'myapp',
          },
          cname: null,
          created_at: '2012-01-01T12:00:00Z',
          hostname: 'example.com',
          id: '11434567-89ab-cdef-0123-456789abcdef',
          kind: 'custom',
          status: 'succeeded',
          updated_at: '2012-01-01T12:00:00Z',
        }

        return new Array(1000).fill(domainData) // eslint-disable-line unicorn/no-new-array
      })

    await runCommand(DomainsIndex, ['--app', 'myapp'])

    expect(stdout.output).to.contain('=== myapp Heroku Domain')
    expect(unwrap(stderr.output)).to.contain('Warning: This app has over 100 domains. Your terminal may not be configured to display the total amount of domains.')
  })
})
