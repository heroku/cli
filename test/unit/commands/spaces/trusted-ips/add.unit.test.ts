import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Add from '../../../../../src/commands/spaces/trusted-ips/add.js'
import {ExtendedInboundRuleset} from '../../../../../src/lib/types/spaces.js'

type FakePlatform = {
  inboundRuleset: {
    create: sinon.SinonStub,
    current: sinon.SinonStub,
  }
}

function buildFakePlatform(): FakePlatform {
  return {
    inboundRuleset: {
      create: sinon.stub(),
      current: sinon.stub(),
    },
  }
}

function buildRuleset(overrides: Partial<ExtendedInboundRuleset> = {}): ExtendedInboundRuleset {
  return {
    created_at: '2024-01-01T00:00:00Z',
    created_by: 'dickeyxxx',
    id: 'ruleset-id',
    rules: [
      {action: 'allow', source: '128.0.0.1/20'},
    ],
    space: {id: 'space-id', name: 'my-space'},
    ...overrides,
  }
}

describe('trusted-ips:add', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('adds a CIDR entry to the trusted IP ranges', async function () {
    fakePlatform.inboundRuleset.current.onFirstCall().resolves(buildRuleset())
    fakePlatform.inboundRuleset.create.resolves(buildRuleset({
      rules: [
        {action: 'allow', source: '128.0.0.1/20'},
        {action: 'allow', source: '127.0.0.1/20'},
      ],
    }))
    fakePlatform.inboundRuleset.current.onSecondCall().resolves(buildRuleset({
      applied: true,
      rules: [
        {action: 'allow', source: '128.0.0.1/20'},
        {action: 'allow', source: '127.0.0.1/20'},
      ],
    }))

    const {stdout} = await runCommand(Add, ['127.0.0.1/20', '--space', 'my-space', '--confirm', 'my-space'])

    expect(stdout).to.eq('Added 127.0.0.1/20 to trusted IP ranges on ⬡ my-space\nTrusted IP rules are applied to this space.\n')
    expect(fakePlatform.inboundRuleset.create.calledOnceWithExactly('my-space', {
      rules: [
        {action: 'allow', source: '128.0.0.1/20'},
        {action: 'allow', source: '127.0.0.1/20'},
      ],
    })).to.equal(true)
  })

  it('shows message when applied is false after add', async function () {
    fakePlatform.inboundRuleset.current.onFirstCall().resolves(buildRuleset())
    fakePlatform.inboundRuleset.create.resolves(buildRuleset({
      rules: [
        {action: 'allow', source: '128.0.0.1/20'},
        {action: 'allow', source: '127.0.0.1/20'},
      ],
    }))
    fakePlatform.inboundRuleset.current.onSecondCall().resolves(buildRuleset({
      applied: false,
      rules: [
        {action: 'allow', source: '128.0.0.1/20'},
        {action: 'allow', source: '127.0.0.1/20'},
      ],
    }))

    const {stdout} = await runCommand(Add, ['127.0.0.1/20', '--space', 'my-space', '--confirm', 'my-space'])

    expect(stdout).to.include('Added 127.0.0.1/20 to trusted IP ranges on ⬡ my-space')
    expect(stdout).to.include('Trusted IP rules are not applied to this space. Update your Trusted IP list to trigger a re-application of the rules.')
  })

  it('shows nothing when applied is undefined (backward compatibility)', async function () {
    fakePlatform.inboundRuleset.current.onFirstCall().resolves(buildRuleset())
    fakePlatform.inboundRuleset.create.resolves(buildRuleset({
      rules: [
        {action: 'allow', source: '128.0.0.1/20'},
        {action: 'allow', source: '127.0.0.1/20'},
      ],
    }))
    fakePlatform.inboundRuleset.current.onSecondCall().resolves(buildRuleset({
      rules: [
        {action: 'allow', source: '128.0.0.1/20'},
        {action: 'allow', source: '127.0.0.1/20'},
      ],
    }))

    const {stdout} = await runCommand(Add, ['127.0.0.1/20', '--space', 'my-space', '--confirm', 'my-space'])

    expect(stdout).to.eq('Added 127.0.0.1/20 to trusted IP ranges on ⬡ my-space\n')
  })

  it('errors when a rule already exists for the source', async function () {
    fakePlatform.inboundRuleset.current.resolves(buildRuleset({
      rules: [
        {action: 'allow', source: '127.0.0.1/20'},
      ],
    }))

    const {error} = await runCommand(Add, ['127.0.0.1/20', '--space', 'my-space', '--confirm', 'my-space'])

    expect(error).to.exist
    expect(error!.message).to.include('A rule already exists for 127.0.0.1/20.')
  })
})
