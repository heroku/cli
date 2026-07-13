import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import DomainsRemove from '../../../../src/commands/domains/remove.js'

type FakePlatform = {
  domain: {delete: SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    domain: {delete: stub()},
  }
}

describe('domains:remove', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    restore()
  })

  it('removes a single domain provided by an argument', async function () {
    fakePlatform.domain.delete.resolves({})

    const {stderr} = await runCommand(DomainsRemove, ['example.com', '--app', 'myapp'])

    expect(stderr).to.contain('Removing example.com from ⬢ myapp... done')
  })
})
