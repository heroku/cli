import {expect, test} from '@oclif/test'

const APP = 'myapp'
const TO_STACK = 'heroku-22'
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

describe('stack:set', () => {
  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com', api => {
      api
        .patch(`/apps/${APP}`, {build_stack: TO_STACK})
        .reply(200, pendingUpgradeApp)
    })
    .command(['apps:stacks:set', `--app=${APP}`, TO_STACK])
    .it('sets the stack', ({stderr, stdout}) => {
      expect(stderr).to.contain(`Setting stack to ${TO_STACK}`)
      expect(stderr).to.contain('... done')
      expect(stdout).to.equal(`You will need to redeploy ⬢ ${APP} for the change to take effect.\nRun git push heroku ${MAIN_REMOTE} to trigger a new build on ⬢ ${APP}.\n`)
    })

  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com', api => {
      api.patch(`/apps/${APP}`, {build_stack: TO_STACK})
        .reply(200, pendingUpgradeApp)
    })
    .command(['apps:stacks:set', `--app=${APP}`, '--remote=staging', TO_STACK])
    .it('sets the stack on a different remote', ({stderr, stdout}) => {
      expect(stderr).to.contain(`Setting stack to ${TO_STACK}`)
      expect(stderr).to.contain('... done')
      expect(stdout).to.equal(`You will need to redeploy ⬢ ${APP} for the change to take effect.\nRun git push ${STAGE_REMOTE} main to trigger a new build on ⬢ ${APP}.\n`)
    })

  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com', api => {
      api.patch(`/apps/${APP}`, {build_stack: TO_STACK})
        .reply(200, completedUpgradeApp)
    })
    .command(['apps:stacks:set', `--app=${APP}`, TO_STACK])
    .it('does not show the redeploy message if the stack was immediately updated by API', ({stderr, stdout}) => {
      expect(stderr).to.contain(`Setting stack to ${TO_STACK}`)
      expect(stderr).to.contain('... done')
      expect(stdout).to.equal('')
    })
})
