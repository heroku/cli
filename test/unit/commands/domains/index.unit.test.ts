import {runCommand} from '@heroku-cli/test-utils'
import {hux} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'

import DomainsIndex from '../../../../src/commands/domains/index.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'
import {unwrap} from '../../../helpers/utils/unwrap.js'

describe('domains', function () {
  let confirmStub: sinon.SinonStub
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    confirmStub = sinon
      .stub(DomainsIndex.prototype, 'confirmDisplayAllDomains')
      .resolves(true)
  })

  afterEach(function () {
    api.done()
    confirmStub.restore()
    nock.cleanAll()
  })

  const herokuOnlyDomainsResponse = [
    {
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
    },
  ]

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

  it('does not show the custom domain header if there are no custom domains', async function () {
    api.get('/apps/myapp/domains').reply(200, herokuOnlyDomainsResponse)

    const {stdout} = await runCommand(DomainsIndex, ['--app', 'myapp'])
    expect(stdout).to.contain('=== ⬢ myapp Heroku Domain\n\nmyapp.herokuapp.com')
    expect(stdout).to.contain('myapp.herokuapp.com')
    expect(stdout).to.not.contain('=== ⬢ myapp Custom Domains')
  })

  it('shows a list of domains and their DNS targets when there are custom domains', async function () {
    api.get('/apps/myapp/domains').reply(200, herokuAndCustomDomainsResponse)

    const {stdout} = await runCommand(DomainsIndex, ['--app', 'myapp'])
    const actual = removeAllWhitespace(stdout)
    expect(stdout).to.contain('=== ⬢ myapp Heroku Domain\n\nmyapp.herokuapp.com')
    expect(stdout).to.contain('myapp.herokuapp.com')
    expect(stdout).to.contain('=== ⬢ myapp Custom Domains')
    expect(actual).to.contain(removeAllWhitespace('Domain Name     DNS Record Type DNS Target'))
    expect(actual).to.contain(removeAllWhitespace('example.com     ALIAS or ANAME  foo.herokudns.com'))
    expect(actual).to.contain(removeAllWhitespace('www.example.com CNAME           bar.herokudns.com'))
    expect(actual).to.contain(removeAllWhitespace('*.example.com   CNAME           buzz.herokudns.com'))
  })

  it('shows the SNI endpoint column when multiple sni endpoints are enabled', async function () {
    api.get('/apps/myapp/domains').reply(200, herokuDomainWithSniEndpoint)

    const {stdout} = await runCommand(DomainsIndex, ['--app', 'myapp'])
    const actual = removeAllWhitespace(stdout)
    expect(actual).to.contain(removeAllWhitespace('Domain Name   DNS Record Type DNS Target         SNI Endpoint'))
    expect(actual).to.contain(removeAllWhitespace('*.example.com CNAME           buzz.herokudns.com some haiku'))
  })

  it('shows warning message for over 100 domains', async function () {
    api.get('/apps/myapp/domains').reply(200, () => {
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

    const {stderr, stdout} = await runCommand(DomainsIndex, ['--app', 'myapp'])
    expect(stdout).to.contain('=== ⬢ myapp Heroku Domain')
    expect(unwrap(stderr)).to.contain('Warning: This app has over 100 domains. Your terminal may not be configured to display the total amount of domains.')
  })

  it('passes no-wrap option through to table rendering', async function () {
    api.get('/apps/myapp/domains').reply(200, herokuAndCustomDomainsResponse)
    const tableStub = sinon.stub(hux, 'table')

    await runCommand(DomainsIndex, ['--app', 'myapp', '--no-wrap'])

    expect(tableStub.calledOnce).to.equal(true)
    const callArgs = tableStub.firstCall.args
    expect(callArgs[2]).to.include({maxWidth: 'none', overflow: 'truncate'})

    tableStub.restore()
  })
})
