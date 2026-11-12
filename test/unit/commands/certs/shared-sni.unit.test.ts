// shouldHandleArgs(commandText, command, getResolveStub, {args?, flags?, stderr?, stdout?})
//
// Shared --name / --endpoint coverage for the commands that select one of an app's SSL
// certificates through the SDK's resolver (`sniEndpoint.resolve`, `resolveAndDelete`,
// `resolveAndUpdate`). `getResolveStub` returns the caller's stub for that method, already set up
// in its own `beforeEach` to succeed with `endpoint` (see `resolvesThroughHook`). The resolver's
// matching rules are tested in the SDK; this harness checks the flags-to-selector mapping and how
// the command reports resolver errors.
import type {SinonStub} from 'sinon'

import {expectOutput, type GenericCmd, runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import tsheredoc from 'tsheredoc'

import {SniEndpoint} from '../../../../src/lib/types/sni-endpoint.js'
import {certificateDetails, endpoint, endpoint2} from '../../../helpers/stubs/sni-endpoints.js'

const heredoc = tsheredoc

/**
 * Make a `resolveAndDelete` / `resolveAndUpdate` stub behave like the SDK: run the command's
 * before-hook (its last argument's `beforeDelete` / `beforeUpdate`) with the resolved endpoint,
 * then resolve with `result`.
 */
export function resolvesThroughHook(stub: SinonStub, hook: 'beforeDelete' | 'beforeUpdate', resolved: unknown, result: unknown = resolved): void {
  stub.callsFake(async (...args: unknown[]) => {
    const options = args.at(-1) as Partial<Record<typeof hook, (sniEndpoint: unknown) => Promise<void> | void>>
    await options[hook]?.(resolved)
    return result
  })
}

export const shouldHandleArgs = (
  commandText: string,
  command: GenericCmd,
  getResolveStub: () => SinonStub,
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
  const run = (...flags: string[]) => runCommand(command, [...additionalArgs, '--app', 'example', ...flags, ...additionalFlags])

  describe(`${commandText}`, function () {
    it('selects the certificate by name with --name', async function () {
      const {stderr, stdout} = await run('--name', 'tokyo-1050')
      expect(getResolveStub().firstCall.args.slice(0, 2)).to.deep.equal(['example', {name: 'tokyo-1050'}])
      expectOutput(stderr, stderrOutput(endpoint))
      expectOutput(stdout, stdoutOutput(heredoc(certificateDetails), endpoint))
    })

    it('selects the certificate by an associated hostname with --endpoint', async function () {
      const {stderr, stdout} = await run('--endpoint', 'www.example.com')
      expect(getResolveStub().firstCall.args.slice(0, 2)).to.deep.equal(['example', {hostname: 'www.example.com'}])
      expectOutput(stderr, stderrOutput(endpoint))
      expectOutput(stdout, stdoutOutput(heredoc(certificateDetails), endpoint))
    })

    it('selects the app\'s only certificate without --name or --endpoint', async function () {
      await run()
      expect(getResolveStub().firstCall.args.slice(0, 2)).to.deep.equal(['example', {}])
    })

    it('rejects --name with --endpoint before any request', async function () {
      const {error} = await run('--name', 'tokyo-1050', '--endpoint', 'www.example.com')
      expect(error?.message).to.match(/cannot also be provided when using/)
      expect(getResolveStub().called).to.equal(false)
    })

    it('names --name when the app has several certificates', async function () {
      getResolveStub().rejects(Object.assign(new Error('example has 2 SSL certificates (tokyo-1050, akita-7777); select one by name.'), {
        appIdentity: 'example', matches: [endpoint, endpoint2], name: 'SniEndpointAmbiguousError',
      }))
      const {error} = await run()
      expect(error?.message).to.equal('example has 2 SSL certificates (tokyo-1050, akita-7777). Pass --name to select one.')
    })

    it('reports the SDK\'s message when nothing matches', async function () {
      getResolveStub().rejects(Object.assign(new Error('www.example.com isn\'t a domain on example.'), {name: 'SniEndpointNotFoundError', statusCode: 404}))
      const {error} = await run('--endpoint', 'www.example.com')
      expect(error?.message).to.equal('www.example.com isn\'t a domain on example.')
    })
  })
}
