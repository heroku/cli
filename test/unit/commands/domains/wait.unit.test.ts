import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {WaitForReadyOptions} from '@heroku/sdk/extensions/platform'
import {Domain} from '@heroku/types/3.sdk'
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
    fakePlatform.domain.wait.callsFake(async (_app: string, opts?: WaitForReadyOptions) => {
      opts?.poller?.onStart?.({hostname: opts?.hostname} as Domain)
      opts?.poller?.onStop?.({hostname: opts?.hostname} as Domain)
      return [{hostname: 'example.com', id: 123, status: 'succeeded'}]
    })

    const {stderr} = await runCommand(DomainsWait, ['example.com', '--app', 'myapp'])

    expect(stderr).to.contain('Waiting for example.com... done')
    const [app, options] = fakePlatform.domain.wait.firstCall.args
    expect(app).to.equal('myapp')
    expect(options.hostname).to.equal('example.com')
    expect(options.poller).to.be.an('object')
  })

  it('waits on domains when no hostname is provided', async function () {
    fakePlatform.domain.wait.callsFake(async (_app: string, opts?: WaitForReadyOptions) => {
      opts?.poller?.onStart?.({hostname: 'example.com'} as Domain)
      opts?.poller?.onStop?.({hostname: 'example.com'} as Domain)
      return [{hostname: 'example.com', id: 123, status: 'succeeded'}]
    })

    const {stderr} = await runCommand(DomainsWait, ['--app', 'myapp'])

    expect(stderr).to.contain('Waiting for example.com... done')
    const [app, options] = fakePlatform.domain.wait.firstCall.args
    expect(app).to.equal('myapp')
    expect(options.hostname).to.equal(undefined)
    expect(options.poller).to.be.an('object')
  })

  it('waits on multiple domains when no hostname is provided', async function () {
    fakePlatform.domain.wait.callsFake(async (_app: string, opts?: WaitForReadyOptions) => {
      for (const hostname of ['example1.com', 'example2.com']) {
        opts?.poller?.onStart?.({hostname} as Domain)
        opts?.poller?.onStop?.({hostname} as Domain)
      }

      return [
        {hostname: 'example1.com', id: 123, status: 'succeeded'},
        {hostname: 'example2.com', id: 456, status: 'succeeded'},
      ]
    })

    const {stderr} = await runCommand(DomainsWait, ['--app', 'myapp'])

    expect(stderr).to.contain('Waiting for example1.com... done')
    expect(stderr).to.contain('Waiting for example2.com... done')
  })
})
