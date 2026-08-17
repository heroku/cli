import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'
import tsheredoc from 'tsheredoc'

import Index from '../../../../../src/commands/spaces/trusted-ips/index.js'
import {ExtendedInboundRuleset} from '../../../../../src/lib/types/spaces.js'

const heredoc = tsheredoc.default

const now = new Date()

type FakePlatform = {
  inboundRuleset: {current: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    inboundRuleset: {current: sinon.stub()},
  }
}

function buildRuleset(overrides: Partial<ExtendedInboundRuleset> = {}): ExtendedInboundRuleset {
  return {
    created_at: now.toISOString(),
    created_by: 'dickeyxxx',
    id: 'ruleset-id',
    rules: [
      {action: 'allow', source: '127.0.0.1/20'},
    ],
    space: {id: 'space-id', name: 'my-space'},
    ...overrides,
  }
}

describe('trusted-ips', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('shows the trusted IP ranges', async function () {
    fakePlatform.inboundRuleset.current.resolves(buildRuleset({applied: true}))

    const {stdout} = await runCommand(Index, ['--space', 'my-space'])

    expect(stdout).to.equal(heredoc(`
    === Trusted IP Ranges

    127.0.0.1/20
    Trusted IP rules are applied to this space.
    `))
    expect(fakePlatform.inboundRuleset.current.calledOnceWithExactly('my-space')).to.equal(true)
  })

  it('shows the trusted IP ranges with blank rules', async function () {
    fakePlatform.inboundRuleset.current.resolves(buildRuleset({applied: true, rules: []}))

    const {stdout} = await runCommand(Index, ['--space', 'my-space'])

    expect(stdout).to.equal('=== my-space has no trusted IP ranges. All inbound web requests to dynos are blocked.\n\nTrusted IP rules are applied to this space.\n')
  })

  it('shows the trusted IP ranges --json', async function () {
    const ruleset = buildRuleset({applied: true})
    fakePlatform.inboundRuleset.current.resolves(ruleset)

    const {stdout} = await runCommand(Index, ['--space', 'my-space', '--json', 'true'])

    expect(JSON.parse(stdout)).to.eql(ruleset)
  })

  it('shows message when applied is false', async function () {
    fakePlatform.inboundRuleset.current.resolves(buildRuleset({applied: false}))

    const {stdout} = await runCommand(Index, ['--space', 'my-space'])

    expect(stdout).to.include('Trusted IP rules are not applied to this space. Update your Trusted IP list to trigger a re-application of the rules.')
  })

  it('shows nothing when applied is undefined (backward compatibility)', async function () {
    fakePlatform.inboundRuleset.current.resolves(buildRuleset())

    const {stdout} = await runCommand(Index, ['--space', 'my-space'])

    expect(stdout).to.equal(heredoc(`
    === Trusted IP Ranges

    127.0.0.1/20
    `))
  })
})
