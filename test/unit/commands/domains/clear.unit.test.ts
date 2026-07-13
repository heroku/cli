import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import DomainsClear from '../../../../src/commands/domains/clear.js'

type FakePlatform = {
  domain: {clear: SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    domain: {clear: stub()},
  }
}

describe('domains:clear', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    restore()
  })

  it('clears domains all domains', async function () {
    fakePlatform.domain.clear.resolves({})

    const {stderr} = await runCommand(DomainsClear, ['--app', 'myapp'])

    expect(stderr).to.contain('Removing all domains from ⬢ myapp... done')
  })
})
