import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import DomainsUpdate from '../../../../src/commands/domains/update.js'

type FakePlatform = {
  domain: {update: SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    domain: {update: stub()},
  }
}

describe('domains:update', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    restore()
  })

  const responseBody = {
    acm_status: null,
    acm_status_reason: null,
    app: {id: '9b688aae-2873-419a-9ec6-f4076d945436', name: 'multi-sni-testing'},
    cname: 'powerful-quail-4c0079v4aa19q90x6kz2m7qk.herokudns.com',
    created_at: '2019-12-10T17:53:01Z',
    hostname: 'example.com',
    id: '7ac15e30-6460-48e1-919a-e794bf3512ac',
    kind: 'custom',
    sni_endpoint: {
      id: '8cae023a-d8f1-4aca-9929-e516dc011694',
    },
    status: 'succeeded',
  }

  it('updates the domain to use a different certificate', async function () {
    fakePlatform.domain.update.resolves(responseBody)

    const {stderr} = await runCommand(DomainsUpdate, ['example.com', '--cert', 'sniendpoint-id', '--app', 'myapp'])

    expect(stderr).to.contain('Updating example.com to use sniendpoint-id certificate... done')
  })
})
