// shouldHandleArgs(commandText, command, getFakePlatform, {args?, flags?, stderr?, stdout?})
//
// `getFakePlatform` is a getter the caller supplies that returns the fake platform its own
// `beforeEach` already built and wired onto `HerokuSDK.prototype` (via
// `sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)`). This harness only
// configures the command-specific stubs (`sniEndpoint.list`, `domain.info`, and — when present —
// `sniEndpoint.info`) inside each `it` to reproduce the scenario under test. It stubs nothing on
// `HerokuSDK.prototype` itself.
import type {SinonStub} from 'sinon'

import {expectOutput, type GenericCmd, runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import tsheredoc from 'tsheredoc'

import {SniEndpoint} from '../../../../src/lib/types/sni-endpoint.js'
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

const heredoc = tsheredoc.default

export type FakePlatform = {
  domain: {info: SinonStub},
  sniEndpoint: {info?: SinonStub, list: SinonStub},
}

export const shouldHandleArgs = (
  commandText: string,
  command: GenericCmd,
  getFakePlatform: () => FakePlatform,
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
    it('allows an --endpoint to be specified using --name', async function () {
      const fakePlatform = getFakePlatform()
      fakePlatform.sniEndpoint.list.resolves([endpoint])
      const {stderr, stdout} = await runCommand(command, [...additionalArgs,
        '--app',
        'example',
        '--name',
        'tokyo-1050'].concat(additionalFlags))
      expectOutput(stderr, stderrOutput(endpoint))
      expectOutput(stdout, stdoutOutput(heredoc(certificateDetails), endpoint))
    })

    it('errors out for --endpoint when there are multiple', async function () {
      const fakePlatform = getFakePlatform()
      fakePlatform.sniEndpoint.list.resolves([endpoint, endpointCname])
      fakePlatform.domain.info.withArgs('example', '456789ab-cdef-0123-4567-89abcdef0123').resolves(endpointDomain)
      fakePlatform.domain.info.withArgs('example', '01234567-89ab-cdef-0123-456789abcdef').resolves(endpointCnameDomain)
      const {error} = await runCommand(command, [...additionalArgs,
        '--app',
        'example',
        '--endpoint',
        'tokyo-1050.herokussl.com'].concat(additionalFlags))
      expect(error).to.exist
      expect(error!.message).to.equal('Must pass --name when more than one endpoint matches --endpoint')
    })

    it('allows an endpoint to be specified using --endpoint', async function () {
      const fakePlatform = getFakePlatform()
      fakePlatform.sniEndpoint.list.resolves([endpoint])
      fakePlatform.domain.info.withArgs('example', '456789ab-cdef-0123-4567-89abcdef0123').resolves(endpointDomain)
      const {stderr, stdout} = await runCommand(command, [...additionalArgs,
        '--app',
        'example',
        '--endpoint',
        'tokyo-1050.herokussl.com'].concat(additionalFlags))
      expectOutput(stderr, stderrOutput(endpoint))
      expectOutput(stdout, stdoutOutput(heredoc(certificateDetails), endpoint))
    })

    it('errors out if there is no match for --endpoint', async function () {
      const fakePlatform = getFakePlatform()
      fakePlatform.sniEndpoint.list.resolves([endpoint2])
      fakePlatform.domain.info.withArgs('example', '89abcdef-0123-4567-89ab-cdef01234567').resolves(endpoint2Domain)
      const {error} = await runCommand(command, [...additionalArgs,
        '--app',
        'example',
        '--endpoint',
        'tokyo-1050.herokussl.com'].concat(additionalFlags))
      expect(error).to.exist
      expect(error!.message).to.equal('Record not found.')
    })

    it('errors out if more than one matches --name', async function () {
      const fakePlatform = getFakePlatform()
      fakePlatform.sniEndpoint.list.resolves([endpoint, endpointHeroku])
      const {error} = await runCommand(command, [...additionalArgs,
        '--app',
        'example',
        '--name',
        'tokyo-1050'].concat(additionalFlags))
      expect(error).to.exist
      expect(error!.message).to.equal('More than one endpoint matches tokyo-1050, please file a support ticket')
    })
  })
}
