import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Apps from '../../../../src/commands/apps/index.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

type FakePlatform = {
  account: {info: sinon.SinonStub}
  app: {
    list: sinon.SinonStub
    listOwnedAndCollaborated: sinon.SinonStub
  }
  space: {info: sinon.SinonStub}
  teamApp: {listByTeam: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    account: {info: sinon.stub()},
    app: {
      list: sinon.stub(),
      listOwnedAndCollaborated: sinon.stub(),
    },
    space: {info: sinon.stub()},
    teamApp: {listByTeam: sinon.stub()},
  }
}

describe('apps', function () {
  const example = {
    name: 'example',
    owner: {email: 'foo@bar.com'},
    region: {name: 'us'},
  }

  const lockedApp = {
    locked: true,
    name: 'locked-app',
    owner: {email: 'foo@bar.com'},
    region: {name: 'us'},
  }

  const internalApp = {
    internal_routing: true,
    name: 'internal-app',
    owner: {email: 'foo@bar.com'},
    region: {name: 'us'},
    space: {id: 'test-space-id', name: 'test-space'},
  }

  const internalLockedApp = {
    internal_routing: true,
    locked: true,
    name: 'internal-app',
    owner: {email: 'foo@bar.com'},
    region: {name: 'us'},
    space: {id: 'test-space-id', name: 'test-space'},
  }

  const euApp = {
    name: 'example-eu',
    owner: {email: 'foo@bar.com'},
    region: {name: 'eu'},
  }

  const collabApp = {
    name: 'collab-app',
    owner: {email: 'someone-else@bar.com'},
  }

  const teamApp1 = {
    name: 'team-app-1',
    owner: {email: 'test-team@herokumanager.com'},
  }

  const teamApp2 = {
    name: 'team-app-2',
    owner: {email: 'test-team@herokumanager.com'},
  }

  const teamSpaceApp1 = {
    name: 'space-app-1',
    owner: {email: 'test-team@herokumanager.com'},
    space: {id: 'test-space-id', name: 'test-space'},
  }

  const teamSpaceApp2 = {
    name: 'space-app-2',
    owner: {email: 'test-team@herokumanager.com'},
    space: {id: 'test-space-id', name: 'test-space'},
  }

  const teamSpaceInternalApp = {
    internal_routing: true,
    name: 'space-internal-app',
    owner: {email: 'test-team@herokumanager.com'},
    space: {id: 'test-space-id', name: 'test-space'},
  }

  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  describe('with no args', function () {
    it('displays a message when the user has no apps', async function () {
      fakePlatform.account.info.resolves({email: 'foo@bar.com'})
      fakePlatform.app.listOwnedAndCollaborated.resolves([])

      const {stderr, stdout} = await runCommand(Apps, [])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('You have no apps.\n')
      expect(fakePlatform.app.listOwnedAndCollaborated.calledOnceWithExactly('~')).to.equal(true)
    })

    it('list all user apps', async function () {
      fakePlatform.account.info.resolves({email: 'foo@bar.com'})
      fakePlatform.app.listOwnedAndCollaborated.resolves([example, collabApp])

      const {stderr, stdout} = await runCommand(Apps, [])

      expect(stderr).to.equal('')
      const actual = removeAllWhitespace(stdout)
      const expectedPersonalApps = removeAllWhitespace(`
          === foo@bar.com Apps
          ⬢ example`)
      const expectedCollaboratedAppsHeader = removeAllWhitespace('Collaborated Apps')
      const expectedCollaboratedApps = removeAllWhitespace('collab-app someone-else@bar.com')
      expect(actual).to.include(expectedPersonalApps)
      expect(actual).to.include(expectedCollaboratedAppsHeader)
      expect(actual).to.include(expectedCollaboratedApps)
    })

    it('lists all apps', async function () {
      fakePlatform.account.info.resolves({email: 'foo@bar.com'})
      fakePlatform.app.list.resolves([example, collabApp, teamApp1])

      const {stderr, stdout} = await runCommand(Apps, ['--all'])

      expect(stderr).to.equal('')
      const actual = removeAllWhitespace(stdout)
      const expectedPersonalApps = removeAllWhitespace(`
          === foo@bar.com Apps
          ⬢ example`)
      const expectedCollaboratedAppsHeader = removeAllWhitespace('Collaborated Apps')
      const expectedCollaboratedApps = removeAllWhitespace('collab-app someone-else@bar.com')
      expect(actual).to.include(expectedPersonalApps)
      expect(actual).to.include(expectedCollaboratedAppsHeader)
      expect(actual).to.include(expectedCollaboratedApps)
      expect(fakePlatform.app.list.calledOnce).to.equal(true)
      expect(fakePlatform.app.listOwnedAndCollaborated.called).to.equal(false)
    })

    it('shows as json', async function () {
      fakePlatform.account.info.resolves({email: 'foo@bar.com'})
      fakePlatform.app.listOwnedAndCollaborated.resolves([example, collabApp])

      const {stderr, stdout} = await runCommand(Apps, ['--json'])

      expect(stderr).to.equal('')
      expect(JSON.parse(stdout)[0].name).to.equal('collab-app')
    })

    it('shows region if not us', async function () {
      fakePlatform.account.info.resolves({email: 'foo@bar.com'})
      fakePlatform.app.listOwnedAndCollaborated.resolves([example, euApp])

      const {stderr, stdout} = await runCommand(Apps, [])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== foo@bar.com Apps\n\n⬢ example\n⬢ example-eu (eu)\n')
    })

    it('shows locked app', async function () {
      fakePlatform.account.info.resolves({email: 'foo@bar.com'})
      fakePlatform.app.listOwnedAndCollaborated.resolves([example, euApp, lockedApp])

      const {stderr, stdout} = await runCommand(Apps, [])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== foo@bar.com Apps\n\n⬢ example\n⬢ example-eu (eu)\n⬢ locked-app [locked]\n')
    })

    it('shows locked eu app', async function () {
      const euLockedApp = {...lockedApp, region: {name: 'eu'}}
      fakePlatform.account.info.resolves({email: 'foo@bar.com'})
      fakePlatform.app.listOwnedAndCollaborated.resolves([example, euApp, euLockedApp])

      const {stderr, stdout} = await runCommand(Apps, [])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== foo@bar.com Apps\n\n⬢ example\n⬢ example-eu (eu)\n⬢ locked-app [locked] (eu)\n')
    })

    it('shows internal app', async function () {
      fakePlatform.account.info.resolves({email: 'foo@bar.com'})
      fakePlatform.app.listOwnedAndCollaborated.resolves([example, euApp, internalApp])

      const {stderr, stdout} = await runCommand(Apps, [])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== foo@bar.com Apps\n\n⬢ example\n⬢ example-eu (eu)\n⬢ internal-app [internal]\n')
    })

    it('shows internal locked app', async function () {
      fakePlatform.account.info.resolves({email: 'foo@bar.com'})
      fakePlatform.app.listOwnedAndCollaborated.resolves([example, euApp, internalLockedApp])

      const {stderr, stdout} = await runCommand(Apps, [])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== foo@bar.com Apps\n\n⬢ example\n⬢ example-eu (eu)\n⬢ internal-app [internal/locked]\n')
    })

    it('shows internal eu app', async function () {
      const euInternalApp = {...internalApp, region: {name: 'eu'}}
      fakePlatform.account.info.resolves({email: 'foo@bar.com'})
      fakePlatform.app.listOwnedAndCollaborated.resolves([example, euApp, euInternalApp])

      const {stderr, stdout} = await runCommand(Apps, [])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== foo@bar.com Apps\n\n⬢ example\n⬢ example-eu (eu)\n⬢ internal-app [internal] (eu)\n')
    })

    it('shows internal locked eu app', async function () {
      const euInternalLockedApp = {...internalLockedApp, region: {name: 'eu'}}
      fakePlatform.account.info.resolves({email: 'foo@bar.com'})
      fakePlatform.app.listOwnedAndCollaborated.resolves([example, euApp, euInternalLockedApp])

      const {stderr, stdout} = await runCommand(Apps, [])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== foo@bar.com Apps\n\n⬢ example\n⬢ example-eu (eu)\n⬢ internal-app [internal/locked] (eu)\n')
    })
  })

  describe('with team', function () {
    it('displays a message when the team has no apps', async function () {
      fakePlatform.account.info.resolves({email: 'foo@bar.com'})
      fakePlatform.teamApp.listByTeam.resolves([])

      const {stderr, stdout} = await runCommand(Apps, ['--team', 'test-team'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('There are no apps in team test-team.\n')
      expect(fakePlatform.teamApp.listByTeam.calledOnceWithExactly('test-team')).to.equal(true)
    })

    it('list all in a team', async function () {
      fakePlatform.account.info.resolves({email: 'foo@bar.com'})
      fakePlatform.teamApp.listByTeam.resolves([teamApp1, teamApp2])

      const {stderr, stdout} = await runCommand(Apps, ['--team', 'test-team'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== Apps in team test-team\n\n⬢ team-app-1\n⬢ team-app-2\n')
    })
  })

  describe('with space', function () {
    it('displays a message when the space has no apps', async function () {
      fakePlatform.account.info.resolves({email: 'foo@bar.com'})
      fakePlatform.space.info.resolves({team: {name: 'test-team'}})
      fakePlatform.teamApp.listByTeam.resolves([])

      const {stderr, stdout} = await runCommand(Apps, ['--space', 'test-space'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('There are no apps in space ⬡ test-space.\n')
      expect(fakePlatform.space.info.calledOnceWithExactly('test-space')).to.equal(true)
      expect(fakePlatform.teamApp.listByTeam.calledOnceWithExactly('test-team')).to.equal(true)
    })

    it('lists only apps in spaces by name', async function () {
      fakePlatform.account.info.resolves({email: 'foo@bar.com'})
      fakePlatform.space.info.resolves({team: {name: 'test-team'}})
      fakePlatform.teamApp.listByTeam.resolves([teamSpaceApp1, teamSpaceApp2, teamApp1])

      const {stderr, stdout} = await runCommand(Apps, ['--space', 'test-space'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== Apps in space ⬡ test-space\n\n⬢ space-app-1\n⬢ space-app-2\n')
    })

    it('lists only internal apps in spaces by name', async function () {
      fakePlatform.account.info.resolves({email: 'foo@bar.com'})
      fakePlatform.space.info.resolves({team: {name: 'test-team'}})
      fakePlatform.teamApp.listByTeam.resolves([teamSpaceApp1, teamSpaceApp2, teamApp1, teamSpaceInternalApp])

      const {stderr, stdout} = await runCommand(Apps, ['--space', 'test-space', '--internal-routing'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== Apps in space ⬡ test-space\n\n⬢ space-internal-app [internal]\n')
    })
  })
})
