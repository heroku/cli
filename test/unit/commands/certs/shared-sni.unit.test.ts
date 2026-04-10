import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import {SniEndpoint} from '../../../../src/lib/types/sni-endpoint.js'
import runCommand, {GenericCmd} from '../../../helpers/runCommand.js'
import {
  certificateDetails,
  endpoint,
  endpoint2,
  endpoint2Domain,
  endpointCname,
  endpointCnameDomain,
  endpointDomain,
  endpointHeroku,
} from '../../../helpers/stubs/sni-endpoints.js'
import expectOutput from '../../../helpers/utils/expectOutput.js'

const heredoc = tsheredoc.default

export const shouldHandleArgs = (
  commandText: string,
  command: GenericCmd,
  callback: (err: Error | null, path: string, endpoint: Partial<SniEndpoint>) => nock.Scope,
  options: {
    args?: string[],
    flags?: {[key: string]: string},
    stderr?: (endpoint: Partial<SniEndpoint>) => string,
    stdout?: (certificateDetails: string, endpoint: Partial<SniEndpoint>) => string,
  },
) => {
  const stdoutOutput = options.stdout || function () {
    return ''
  }

  const stderrOutput = options.stderr || function () {
    return ''
  }

  const additionalFlags = Object.entries(options?.flags || {}).map(([k, v]) => `--${k}=${v}`)
  const additionalArgs: string[] = options.args || []

  describe(`${commandText}`, function () {
    beforeEach(function () {
      nock.cleanAll()
    })

    it('allows an --endpoint to be specified using --name', async function () {
      nock('https://api.heroku.com')
        .get('/apps/example/sni-endpoints')
        .reply(200, [endpoint])
      callback(null, '/apps/example/sni-endpoints/tokyo-1050', endpoint)
      await runCommand(command, [...additionalArgs,
        '--app',
        'example',
        '--name',
        'tokyo-1050'].concat(additionalFlags))
      expectOutput(stderr.output, stderrOutput(endpoint))
      expectOutput(stdout.output, stdoutOutput(heredoc(certificateDetails), endpoint))
    })

    it('errors out for --endpoint when there are multiple', async function () {
      nock('https://api.heroku.com')
        .get('/apps/example/sni-endpoints')
        .reply(200, [endpoint, endpointCname])
        .get('/apps/example/domains/456789ab-cdef-0123-4567-89abcdef0123')
        .reply(200, endpointDomain)
        .get('/apps/example/domains/01234567-89ab-cdef-0123-456789abcdef')
        .reply(200, endpointCnameDomain)
      callback(null, '/apps/example/sni-endpoints/tokyo-1050', endpoint)
      await runCommand(command, [...additionalArgs,
        '--app',
        'example',
        '--endpoint',
        'tokyo-1050.herokussl.com'].concat(additionalFlags)).catch(function (error: Error) {
        expect(error.message).to.equal('Must pass --name when more than one endpoint matches --endpoint')
      })
    })

    it('allows an endpoint to be specified using --endpoint', async function () {
      nock('https://api.heroku.com')
        .get('/apps/example/sni-endpoints')
        .reply(200, [endpoint])
        .get('/apps/example/domains/456789ab-cdef-0123-4567-89abcdef0123')
        .reply(200, endpointDomain)
      callback(null, '/apps/example/sni-endpoints/tokyo-1050', endpoint)
      await runCommand(command, [...additionalArgs,
        '--app',
        'example',
        '--endpoint',
        'tokyo-1050.herokussl.com'].concat(additionalFlags))
      expectOutput(stderr.output, stderrOutput(endpoint))
      expectOutput(stdout.output, stdoutOutput(heredoc(certificateDetails), endpoint))
    })

    it('errors out if there is no match for --endpoint', async function () {
      nock('https://api.heroku.com')
        .get('/apps/example/sni-endpoints')
        .reply(200, [endpoint2])
        .get('/apps/example/domains/89abcdef-0123-4567-89ab-cdef01234567')
        .reply(200, endpoint2Domain)
      await runCommand(command, [...additionalArgs,
        '--app',
        'example',
        '--endpoint',
        'tokyo-1050.herokussl.com'].concat(additionalFlags)).catch(function (error: Error) {
        expect(error.message).to.equal('Record not found.')
      })
    })

    it('errors out if more than one matches --name', async function () {
      nock('https://api.heroku.com')
        .get('/apps/example/sni-endpoints')
        .reply(200, [endpoint, endpointHeroku])
      await runCommand(command, [...additionalArgs,
        '--app',
        'example',
        '--name',
        'tokyo-1050'].concat(additionalFlags)).catch(function (error: Error) {
        expect(error.message).to.equal('More than one endpoint matches tokyo-1050, please file a support ticket')
      })
    })
  })
}
