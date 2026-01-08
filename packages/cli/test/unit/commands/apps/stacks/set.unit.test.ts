import {expect} from 'chai'
import {runCommand} from '@oclif/test'
import nock from 'nock'

const APP = 'myapp'
const TO_STACK = 'heroku-24'
const MAIN_REMOTE = 'main'
const STAGE_REMOTE = 'staging'

const pendingUpgradeApp = {
  name: APP,
  stack: {
    name: 'heroku-16',
  },
  build_stack: {
    name: TO_STACK,
  },
}

const completedUpgradeApp = {
  name: APP,
  stack: {
    name: TO_STACK,
  },
  build_stack: {
    name: TO_STACK,
  },
}

describe('stack:set', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('sets the stack', async function () {
    nock('https://api.heroku.com')
      .patch(`/apps/${APP}`, {build_stack: TO_STACK})
      .reply(200, pendingUpgradeApp)

    const {stderr, stdout} = await runCommand(['apps:stacks:set', `--app=${APP}`, TO_STACK])

    expect(stderr).to.contain(`Setting stack to ${TO_STACK}`)
    expect(stderr).to.contain('... done')
    expect(stdout).to.equal(`You will need to redeploy ⬢ ${APP} for the change to take effect.\nRun git push heroku ${MAIN_REMOTE} to trigger a new build on ⬢ ${APP}.\n`)
  })

  it('sets the stack on a different remote', async function () {
    nock('https://api.heroku.com')
      .patch(`/apps/${APP}`, {build_stack: TO_STACK})
      .reply(200, pendingUpgradeApp)

    const {stderr, stdout} = await runCommand(['apps:stacks:set', `--app=${APP}`, '--remote=staging', TO_STACK])

    expect(stderr).to.contain(`Setting stack to ${TO_STACK}`)
    expect(stderr).to.contain('... done')
    expect(stdout).to.equal(`You will need to redeploy ⬢ ${APP} for the change to take effect.\nRun git push ${STAGE_REMOTE} main to trigger a new build on ⬢ ${APP}.\n`)
  })

  it('does not show the redeploy message if the stack was immediately updated by API', async function () {
    nock('https://api.heroku.com')
      .patch(`/apps/${APP}`, {build_stack: TO_STACK})
      .reply(200, completedUpgradeApp)

    const {stderr, stdout} = await runCommand(['apps:stacks:set', `--app=${APP}`, TO_STACK])

    expect(stderr).to.contain(`Setting stack to ${TO_STACK}`)
    expect(stderr).to.contain('... done')
    expect(stdout).to.equal('')
  })
})
