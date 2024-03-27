import {stdout, stderr} from 'stdout-stderr'
import runCommand, {GenericCmd} from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import {
  endpoint,
  endpoint2,
  endpointCname,
  endpointHeroku,
  certificateDetails,
  endpointDomain,
  endpointCnameDomain,
  endpoint2Domain,
} from '../../../helpers/stubs/sni-endpoints'
import expectOutput from '../../../helpers/utils/expectOutput'
import {SniEndpoint} from '../../../../src/lib/types/sni_endpoint'
import heredoc from 'tsheredoc'

export const shouldHandleArgs = (
  commandText: string,
  command: GenericCmd,
  callback: (err: Error | null, path: string, endpoint: Partial<SniEndpoint>) => nock.Scope,
  options: {
    stderr?: (endpoint: Partial<SniEndpoint>) => string,
    stdout?: (certificateDetails: string, endpoint: Partial<SniEndpoint>) => string,
    args?: string[],
    flags?: {[key: string]: string},
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
      await runCommand(command, additionalArgs.concat([
        '--app',
        'example',
        '--name',
        'tokyo-1050',
      ], additionalFlags))
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
      await runCommand(command, additionalArgs.concat([
        '--app',
        'example',
        '--endpoint',
        'tokyo-1050.herokussl.com',
      ], additionalFlags)).catch(function (error: Error) {
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
      await runCommand(command, additionalArgs.concat([
        '--app',
        'example',
        '--endpoint',
        'tokyo-1050.herokussl.com',
      ], additionalFlags))
      expectOutput(stderr.output, stderrOutput(endpoint))
      expectOutput(stdout.output, stdoutOutput(heredoc(certificateDetails), endpoint))
    })

    it('errors out if there is no match for --endpoint', async function () {
      nock('https://api.heroku.com')
        .get('/apps/example/sni-endpoints')
        .reply(200, [endpoint2])
        .get('/apps/example/domains/89abcdef-0123-4567-89ab-cdef01234567')
        .reply(200, endpoint2Domain)
      await runCommand(command, additionalArgs.concat([
        '--app',
        'example',
        '--endpoint',
        'tokyo-1050.herokussl.com',
      ], additionalFlags)).catch(function (error: Error) {
        expect(error.message).to.equal('Record not found.')
      })
    })

    it('errors out if more than one matches --name', async function () {
      nock('https://api.heroku.com')
        .get('/apps/example/sni-endpoints')
        .reply(200, [endpoint, endpointHeroku])
      await runCommand(command, additionalArgs.concat([
        '--app',
        'example',
        '--name',
        'tokyo-1050',
      ], additionalFlags)).catch(function (error: Error) {
        expect(error.message).to.equal('More than one endpoint matches tokyo-1050, please file a support ticket')
      })
    })
  })
}
