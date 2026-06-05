import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Rename from '../../../../src/commands/apps/rename.js'
import {unwrap} from '../../../helpers/utils/unwrap.js'

type FakePlatform = {
  app: {update: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    app: {update: sinon.stub()},
  }
}

describe('apps:rename', function () {
  const newApp = {
    name: 'newname',
    web_url: 'https://newname.com',
  }
  const newAppSillUsingHttp = {
    name: 'newname',
    web_url: 'http://newname.com',
  }
  const oldApp = {
    name: 'myapp',
  }
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('renames an app', async function () {
    fakePlatform.app.update.resolves(newApp)

    const {stderr, stdout} = await runCommand(Rename, ['-a', oldApp.name, newApp.name])

    expect(stdout).to.equal('https://newname.com | https://git.heroku.com/newname.git\n')
    expect(unwrap(stderr)).to.contains('Renaming ⬢ myapp to newname... doneWarning: Don\'t forget to update git remotes for all other local checkouts of the app.\n')
    expect(fakePlatform.app.update.calledOnceWithExactly(oldApp.name, {name: newApp.name})).to.equal(true)
  })

  it('gives a message if the web_url is still http', async function () {
    fakePlatform.app.update.resolves(newAppSillUsingHttp)

    const {stderr, stdout} = await runCommand(Rename, ['-a', oldApp.name, newApp.name])

    expect(stdout).to.equal('http://newname.com | https://git.heroku.com/newname.git\nPlease note that it may take a few minutes for Heroku to provision a SSL certificate for your application.\n')
    expect(unwrap(stderr)).to.contains('Renaming ⬢ myapp to newname... doneWarning: Don\'t forget to update git remotes for all other local checkouts of the app.\n')
  })
})
