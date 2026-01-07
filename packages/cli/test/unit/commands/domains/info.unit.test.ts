import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('domains:info', function () {
  afterEach(() => nock.cleanAll())

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

  it('shows detailed information about a domain', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/domains/www.example.com')
      .reply(200, domainInfoResponse)

    const {stdout} = await runCommand(['domains:info', 'www.example.com', '--app', 'myapp'])

    expect(stdout).to.contain('acm_status:        pending')
    expect(stdout).to.contain('acm_status_reason: Failing CCA check')
    expect(stdout).to.contain('app:               myapp')
    expect(stdout).to.contain('cname:             example.herokudns.com')
    expect(stdout).to.contain('created_at:        2012-01-01T12:00:00Z')
    expect(stdout).to.contain('hostname:          www.example.com')
    expect(stdout).to.contain('kind:              custom')
    expect(stdout).to.contain('status:            pending')
    expect(stdout).to.contain('updated_at:        2012-01-01T12:00:00Z')
  })
})
