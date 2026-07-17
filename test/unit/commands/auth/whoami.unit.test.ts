import {APIClient} from '@heroku-cli/command'
import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import Whoami from '../../../../src/commands/auth/whoami.js'

type FakePlatform = {
  account: {info: SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    account: {info: stub()},
  }
}

describe('auth:whoami', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
    stub(APIClient.prototype, 'auth').get(() => 'foobar')
  })

  afterEach(function () {
    delete process.env.HEROKU_API_KEY
    restore()
  })

  it('shows user email when logged in', async function () {
    fakePlatform.account.info.resolves({email: 'gandalf@example.com'})

    const {stdout} = await runCommand(Whoami, [])

    expect(stdout).to.equal('gandalf@example.com\n')
    expect(fakePlatform.account.info.calledOnce).to.equal(true)
  })

  it('exits with status 100 when not logged in', async function () {
    const error = Object.assign(new Error('Unauthorized'), {statusCode: 401})
    fakePlatform.account.info.rejects(error)

    const {error: cmdError} = await runCommand(Whoami, [])

    expect(cmdError?.oclif?.exit).to.equal(100)
  })

  it('shows a warning when the HEROKU_API_KEY env var is set', async function () {
    process.env.HEROKU_API_KEY = 'foobar'
    fakePlatform.account.info.resolves({email: 'gandalf@example.com'})

    const {stderr, stdout} = await runCommand(Whoami, [])

    expect(stderr).to.contain('Warning: HEROKU_API_KEY is set')
    expect(stdout).to.equal('gandalf@example.com\n')
  })
})
