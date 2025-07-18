import {stdout, stderr} from 'stdout-stderr'
// import Cmd from '../../../../src/commands/certs/info.js'
import runCommand from '../../../helpers/runCommand.js'
import expectOutput from '../../../helpers/utils/expectOutput.js'
import tsheredoc from 'tsheredoc'
import nock from 'nock'

import {
  endpoint,
  endpointWithDomains,
  endpointUntrusted,
  endpointTrusted,
  certificateDetails,
  certificateDetailsWithDomains,
  untrustedCertificateDetails,
} from '../../../helpers/stubs/sni-endpoints.js'
import * as sharedSni from './shared_sni.unit.test.js'
import {SniEndpoint} from '../../../../src/lib/types/sni_endpoint.js'

const heredoc = tsheredoc.default

/*
describe('heroku certs:info', function () {
  it('shows certificate details when self-signed', async function () {
    nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])
      .get('/apps/example/sni-endpoints/tokyo-1050')
      .reply(200, endpoint)
    await runCommand(Cmd, ['--app', 'example'])
    expectOutput(stderr.output, heredoc(`
      Fetching SSL certificate tokyo-1050 info for ⬢ example... done
    `))
    expectOutput(stdout.output, heredoc(`
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
    await runCommand(Cmd, [
      '--app',
      'example',
      '--show-domains',
    ])
    expectOutput(stdout.output, heredoc(`
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
    await runCommand(Cmd, ['--app', 'example'])
    expectOutput(stderr.output, heredoc(`
      Fetching SSL certificate tokyo-1050 info for ⬢ example... done
    `))
    expectOutput(heredoc(stdout.output), heredoc(`
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
    await runCommand(Cmd, ['--app', 'example'])
    expectOutput(stderr.output, heredoc(`
      Fetching SSL certificate tokyo-1050 info for ⬢ example... done
    `))
    expectOutput(stdout.output, heredoc(`
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

*/
