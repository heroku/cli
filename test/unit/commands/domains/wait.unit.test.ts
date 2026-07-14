import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import DomainsWait from '../../../../src/commands/domains/wait.js'

type FakePlatform = {
  domain: {wait: SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    domain: {wait: stub()},
  }
}

describe('domains:wait', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    restore()
  })

  it('waits on domain status succeeded', async function () {
    fakePlatform.domain.wait.resolves([{hostname: 'example.com', id: 123, status: 'succeeded'}])

    const {stderr} = await runCommand(DomainsWait, ['example.com', '--app', 'myapp'])

    expect(stderr).to.contain('Waiting for domains... done')
    expect(fakePlatform.domain.wait.calledOnceWithExactly('myapp', {hostname: 'example.com'})).to.equal(true)
  })

  it('waits on domains when no hostname is provided', async function () {
    fakePlatform.domain.wait.resolves([{hostname: 'example.com', id: 123, status: 'succeeded'}])

    const {stderr} = await runCommand(DomainsWait, ['--app', 'myapp'])

    expect(stderr).to.contain('Waiting for domains... done')
    expect(fakePlatform.domain.wait.calledOnceWithExactly('myapp', {hostname: undefined})).to.equal(true)
  })
})
