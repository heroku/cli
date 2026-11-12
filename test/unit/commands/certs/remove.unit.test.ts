import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import ansis from 'ansis'
import {expect} from 'chai'
import * as sinon from 'sinon'
import {SinonStub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/certs/remove.js'
import {sniEndpointA} from '../../../fixtures/certs/fixtures.js'
import {expectJsonError, expectJsonSnapshot} from '../../../helpers/json-snapshot.js'
import {endpoint} from '../../../helpers/stubs/sni-endpoints.js'
import * as sharedSni from './shared-sni.unit.test.js'

const heredoc = tsheredoc

type FakePlatform = {
  sniEndpoint: {resolveAndDelete: SinonStub},
}

function buildFakePlatform(): FakePlatform {
  return {
    sniEndpoint: {resolveAndDelete: sinon.stub()},
  }
}

describe('heroku certs:remove', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('# deletes the endpoint', async function () {
    sharedSni.resolvesThroughHook(fakePlatform.sniEndpoint.resolveAndDelete, 'beforeDelete', endpoint)

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'example',
    ])

    expect(stderr).to.equal(heredoc`
      Removing SSL certificate tokyo-1050 from ⬢ example... done
    `)
    expect(fakePlatform.sniEndpoint.resolveAndDelete.calledOnceWith('example', {})).to.equal(true)
  })

  it('# requires confirmation if wrong endpoint on app', async function () {
    const deleted = sinon.stub()
    fakePlatform.sniEndpoint.resolveAndDelete.callsFake(async (_app, _selector, options) => {
      await options.beforeDelete(endpoint)
      deleted()
      return endpoint
    })

    const {error, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'notexample',
    ])

    expect(error).to.exist
    expect(ansis.strip(error!.message)).to.equal('Confirmation notexample did not match example. Aborted.')
    expect(deleted.called).to.equal(false)
    expect(stdout).to.equal('')
  })

  describe('--json', function () {
    const deleted = sinon.stub()

    beforeEach(function () {
      deleted.reset()
      fakePlatform.sniEndpoint.resolveAndDelete.callsFake(async (_app, _selector, options) => {
        await options.beforeDelete(sniEndpointA)
        deleted()
        return sniEndpointA
      })
    })

    it('returns the removed certificate', async function () {
      await expectJsonSnapshot(this, Cmd, ['--app', 'example', '--confirm', 'example'])
    })

    it('requires --confirm instead of prompting', async function () {
      await expectJsonError(Cmd, ['--app', 'example'], 'To proceed, re-run this command with --confirm example. Commands don\'t prompt for confirmation with --json.')

      expect(deleted.called).to.equal(false)
    })

    it('renders an API error as a JSON error document', async function () {
      fakePlatform.sniEndpoint.resolveAndDelete.callsFake(async (_app, _selector, options) => {
        await options.beforeDelete(sniEndpointA)
        throw new Error('Couldn\'t find that SNI endpoint.')
      })

      await expectJsonError(Cmd, ['--app', 'example', '--confirm', 'example'], 'Couldn\'t find that SNI endpoint.')
    })
  })
})

describe('heroku shared', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sharedSni.resolvesThroughHook(fakePlatform.sniEndpoint.resolveAndDelete, 'beforeDelete', endpoint)
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  const stderr = function (endpoint: {name?: string}) {
    return heredoc(`
      Removing SSL certificate ${endpoint.name} from ⬢ example... done
    `)
  }

  sharedSni.shouldHandleArgs('certs:remove', Cmd, () => fakePlatform.sniEndpoint.resolveAndDelete, {flags: {confirm: 'example'}, stderr})
})
