import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import ansis from 'ansis'
import {expect} from 'chai'
import * as sinon from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/certs/auto/disable.js'
import {acmDisabledApp} from '../../../../fixtures/certs/fixtures.js'
import {expectJsonError, expectJsonSnapshot} from '../../../../helpers/json-snapshot.js'

const heredoc = tsheredoc

type FakePlatform = {
  app: {disableACM: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    app: {disableACM: sinon.stub()},
  }
}

describe('heroku certs:auto:disable', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('disables acm', async function () {
    fakePlatform.app.disableACM.resolves({acm: true})
    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'example',
    ])
    expectOutput(stderr, heredoc(`
      Disabling Automatic Certificate Management... done
    `))
    expectOutput(stdout, '')
    expect(fakePlatform.app.disableACM.calledOnceWithExactly('example')).to.equal(true)
  })

  it('confirms that they want to disable', async function () {
    const {error} = await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'notexample',
    ])
    expect(error).to.exist
    expect(ansis.strip(error!.message)).to.equal('Confirmation notexample did not match example. Aborted.')
    expect(fakePlatform.app.disableACM.called).to.equal(false)
  })

  describe('--json', function () {
    it('returns the app', async function () {
      fakePlatform.app.disableACM.resolves(acmDisabledApp)

      await expectJsonSnapshot(this, Cmd, ['--app', 'example', '--confirm', 'example'])
    })

    it('requires --confirm instead of prompting', async function () {
      await expectJsonError(Cmd, ['--app', 'example'], 'To proceed, re-run this command with --confirm example. Commands don\'t prompt for confirmation with --json.')

      expect(fakePlatform.app.disableACM.called).to.equal(false)
    })

    it('renders an API error as a JSON error document', async function () {
      fakePlatform.app.disableACM.rejects(new Error('Couldn\'t find that app.'))

      await expectJsonError(Cmd, ['--app', 'example', '--confirm', 'example'], 'Couldn\'t find that app.')
    })
  })
})
