import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import ansis from 'ansis'
import {expect} from 'chai'
import * as sinon from 'sinon'
import {SinonStub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/certs/remove.js'
import {endpoint} from '../../../helpers/stubs/sni-endpoints.js'
import * as sharedSni from './shared-sni.unit.test.js'

const heredoc = tsheredoc.default

type FakePlatform = {
  domain: {info: SinonStub},
  sniEndpoint: {delete: SinonStub, list: SinonStub},
}

function buildFakePlatform(): FakePlatform {
  return {
    domain: {info: sinon.stub()},
    sniEndpoint: {delete: sinon.stub(), list: sinon.stub()},
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
    fakePlatform.sniEndpoint.list.resolves([endpoint])
    fakePlatform.sniEndpoint.delete.resolves(endpoint)

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'example',
    ])

    expect(stderr).to.equal(heredoc`
      Removing SSL certificate tokyo-1050 from ⬢ example... done
    `)
    expect(fakePlatform.sniEndpoint.delete.calledOnceWithExactly('example', 'tokyo-1050')).to.equal(true)
  })

  it('# requires confirmation if wrong endpoint on app', async function () {
    fakePlatform.sniEndpoint.list.resolves([endpoint])

    const {error, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'notexample',
    ])

    expect(error).to.exist
    expect(ansis.strip(error!.message)).to.equal('Confirmation notexample did not match example. Aborted.')
    expect(fakePlatform.sniEndpoint.list.called).to.equal(true)
    expect(fakePlatform.sniEndpoint.delete.called).to.equal(false)
    expect(stdout).to.equal('')
  })
})

describe('heroku shared', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    fakePlatform.sniEndpoint.delete.resolves(endpoint)
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

  sharedSni.shouldHandleArgs('certs:remove', Cmd, () => fakePlatform, {flags: {confirm: 'example'}, stderr})
})
