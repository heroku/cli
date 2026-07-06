import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Set from '../../../../../src/commands/apps/stacks/set.js'

const APP = 'myapp'
const TO_STACK = 'heroku-24'
const MAIN_REMOTE = 'main'
const STAGE_REMOTE = 'staging'

const pendingUpgradeApp = {
  build_stack: {
    name: TO_STACK,
  },
  name: APP,
  stack: {
    name: 'heroku-16',
  },
}

const completedUpgradeApp = {
  build_stack: {
    name: TO_STACK,
  },
  name: APP,
  stack: {
    name: TO_STACK,
  },
}

type FakePlatform = {
  app: {update: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    app: {update: sinon.stub()},
  }
}

describe('stack:set', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('sets the stack', async function () {
    fakePlatform.app.update.resolves(pendingUpgradeApp)

    const {stderr, stdout} = await runCommand(Set, [`--app=${APP}`, TO_STACK])

    expect(stderr).to.contain(`Setting stack to ${TO_STACK}`)
    expect(stderr).to.contain('... done')
    expect(stdout).to.equal(`You will need to redeploy ⬢ ${APP} for the change to take effect.\nRun git push heroku ${MAIN_REMOTE} to trigger a new build on ⬢ ${APP}.\n`)
    expect(fakePlatform.app.update.calledOnceWithExactly(APP, {build_stack: TO_STACK})).to.equal(true)
  })

  it('sets the stack on a different remote', async function () {
    fakePlatform.app.update.resolves(pendingUpgradeApp)

    const {stderr, stdout} = await runCommand(Set, [`--app=${APP}`, '--remote=staging', TO_STACK])

    expect(stderr).to.contain(`Setting stack to ${TO_STACK}`)
    expect(stderr).to.contain('... done')
    expect(stdout).to.equal(`You will need to redeploy ⬢ ${APP} for the change to take effect.\nRun git push ${STAGE_REMOTE} main to trigger a new build on ⬢ ${APP}.\n`)
  })

  it('does not show the redeploy message if the stack was immediately updated by API', async function () {
    fakePlatform.app.update.resolves(completedUpgradeApp)

    const {stderr, stdout} = await runCommand(Set, [`--app=${APP}`, TO_STACK])

    expect(stderr).to.contain(`Setting stack to ${TO_STACK}`)
    expect(stderr).to.contain('... done')
    expect(stdout).to.equal('')
  })
})
