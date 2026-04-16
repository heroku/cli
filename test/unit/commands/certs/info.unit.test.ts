import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/certs/info.js'
import {SniEndpoint} from '../../../../src/lib/types/sni-endpoint.js'
import {
  certificateDetails,
  certificateDetailsWithDomains,
  endpoint,
  endpointTrusted,
  endpointUntrusted,
  endpointWithDomains,
  untrustedCertificateDetails,
} from '../../../helpers/stubs/sni-endpoints.js'
import * as sharedSni from './shared-sni.unit.test.js'

const heredoc = tsheredoc.default

describe('heroku certs:info', function () {
  it('shows certificate details when self-signed', async function () {
    nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])
      .get('/apps/example/sni-endpoints/tokyo-1050')
      .reply(200, endpoint)
    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'example'])
    expectOutput(stderr, heredoc(`
      Fetching SSL certificate tokyo-1050 info for ⬢ example... done
    `))
    expectOutput(stdout, heredoc(`
      Certificate details:
      ${certificateDetails}
    `))
  })

  it('returns domains when show-domains flag is passed', async function () {
    nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointWithDomains])
      .get('/apps/example/sni-endpoints/tokyo-1050')
      .reply(200, endpointWithDomains)
      .get('/apps/example/domains/tokyo-1050.herokussl.com')
      .reply(200, {
        cname: 'example.herokudns.com',
        hostname: 'subdomain.example.com',
        kind: 'custom',
        status: 'pending',
      })
    const {stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--show-domains',
    ])
    expectOutput(stdout, heredoc(`
      Certificate details:
      ${certificateDetailsWithDomains}
    `))
  })

  it('shows certificate details when not trusted', async function () {
    nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])
      .get('/apps/example/sni-endpoints/tokyo-1050')
      .reply(200, endpointUntrusted)
    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'example'])
    expectOutput(stderr, heredoc(`
      Fetching SSL certificate tokyo-1050 info for ⬢ example... done
    `))
    expectOutput(heredoc(stdout), heredoc(`
      Certificate details:
      ${untrustedCertificateDetails}
    `))
  })

  it('shows certificate details when trusted', async function () {
    nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])
      .get('/apps/example/sni-endpoints/tokyo-1050')
      .reply(200, endpointTrusted)
    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'example'])
    expectOutput(stderr, heredoc(`
      Fetching SSL certificate tokyo-1050 info for ⬢ example... done
    `))
    expectOutput(stdout, heredoc(`
      Certificate details:
      Common Name(s): example.org
      Expires At:     2013-08-01 21:34 UTC
      Issuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
      Starts At:      2012-08-01 21:34 UTC
      Subject:        /C=US/ST=California/L=San Francisco/O=Trusted/CN=trusted.example.org
      SSL certificate is verified by a root authority.
    `))
  })
})

describe('heroku shared', function () {
  const callback = function (err: Error | null, path: string, endpoint: Partial<SniEndpoint>) {
    if (err)
      throw err
    return nock('https://api.heroku.com')
      .get(path)
      .reply(200, endpoint)
  }

  const stderr = function (endpoint: Partial<SniEndpoint>) {
    return heredoc(`
      Fetching SSL certificate ${endpoint.name} info for ⬢ example... done
    `)
  }

  const stdout = function (certDetails: string) {
    return `Certificate details:\n${heredoc(certDetails)}`
  }

  sharedSni.shouldHandleArgs('certs:info', Cmd, callback, {stderr, stdout})
})
