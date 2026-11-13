import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/certs/auto/refresh.js'
import {app} from '../../../../fixtures/certs/fixtures.js'
import {expectJsonError, expectJsonSnapshot} from '../../../../helpers/json-snapshot.js'

const heredoc = tsheredoc

type FakePlatform = {
  app: {refreshACM: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    app: {refreshACM: sinon.stub()},
  }
}

describe('heroku certs:auto:refresh', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('refreshes acm', async function () {
    fakePlatform.app.refreshACM.resolves({acm: true, acm_refresh: true})
    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
    ])
    expectOutput(stderr, heredoc(`
      Refreshing Automatic Certificate Management... done
    `))
    expectOutput(stdout, '')
    expect(fakePlatform.app.refreshACM.calledOnceWithExactly('example', {acm_refresh: true})).to.equal(true)
  })

  describe('--json', function () {
    it('returns the app', async function () {
      fakePlatform.app.refreshACM.resolves(app)

      await expectJsonSnapshot(this, Cmd, ['--app', 'example'])
    })

    it('renders an API error as a JSON error document', async function () {
      fakePlatform.app.refreshACM.rejects(new Error('Couldn\'t find that app.'))

      await expectJsonError(Cmd, ['--app', 'example'], 'Couldn\'t find that app.')
    })
  })
})
