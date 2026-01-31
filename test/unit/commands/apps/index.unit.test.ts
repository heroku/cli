import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

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

  let euLockedApp = {}
  let euInternalApp = {}
  let euInternalLockedApp = {}
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  describe('with no args', function () {
    it('displays a message when the user has no apps', async function () {
      api
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/users/~/apps')
        .reply(200, [])

      const {stderr, stdout} = await runCommand(['apps'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('You have no apps.\n')
    })

    it('list all user apps', async function () {
      api
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/users/~/apps')
        .reply(200, [example, collabApp])

      const {stderr, stdout} = await runCommand(['apps'])

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
      api
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/apps')
        .reply(200, [example, collabApp, teamApp1])

      const {stderr, stdout} = await runCommand(['apps', '--all'])

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

    it('shows as json', async function () {
      api
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/users/~/apps')
        .reply(200, [example, collabApp])

      const {stderr, stdout} = await runCommand(['apps', '--json'])

      expect(stderr).to.equal('')
      expect(JSON.parse(stdout)[0].name).to.equal('collab-app')
    })

    it('shows region if not us', async function () {
      api
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/users/~/apps')
        .reply(200, [example, euApp])

      const {stderr, stdout} = await runCommand(['apps'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== foo@bar.com Apps\n\n⬢ example\n⬢ example-eu (eu)\n')
    })

    it('shows locked app', async function () {
      api
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/users/~/apps')
        .reply(200, [example, euApp, lockedApp])

      const {stderr, stdout} = await runCommand(['apps'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== foo@bar.com Apps\n\n⬢ example\n⬢ example-eu (eu)\n⬢ locked-app [locked]\n')
    })

    it('shows locked eu app', async function () {
      euLockedApp = Object.assign(lockedApp, {region: {name: 'eu'}})

      api
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/users/~/apps')
        .reply(200, [example, euApp, euLockedApp])

      const {stderr, stdout} = await runCommand(['apps'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== foo@bar.com Apps\n\n⬢ example\n⬢ example-eu (eu)\n⬢ locked-app [locked] (eu)\n')
    })

    it('shows internal app', async function () {
      api
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/users/~/apps')
        .reply(200, [example, euApp, internalApp])

      const {stderr, stdout} = await runCommand(['apps'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== foo@bar.com Apps\n\n⬢ example\n⬢ example-eu (eu)\n⬢ internal-app [internal]\n')
    })

    it('shows internal locked app', async function () {
      api
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/users/~/apps')
        .reply(200, [example, euApp, internalLockedApp])

      const {stderr, stdout} = await runCommand(['apps'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== foo@bar.com Apps\n\n⬢ example\n⬢ example-eu (eu)\n⬢ internal-app [internal/locked]\n')
    })

    it('shows internal eu app', async function () {
      euInternalApp = Object.assign(internalApp, {region: {name: 'eu'}})

      api
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/users/~/apps')
        .reply(200, [example, euApp, euInternalApp])

      const {stderr, stdout} = await runCommand(['apps'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== foo@bar.com Apps\n\n⬢ example\n⬢ example-eu (eu)\n⬢ internal-app [internal] (eu)\n')
    })

    it('shows internal locked eu app', async function () {
      euInternalLockedApp = Object.assign(internalLockedApp, {region: {name: 'eu'}})

      api
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/users/~/apps')
        .reply(200, [example, euApp, euInternalLockedApp])

      const {stderr, stdout} = await runCommand(['apps'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== foo@bar.com Apps\n\n⬢ example\n⬢ example-eu (eu)\n⬢ internal-app [internal/locked] (eu)\n')
    })
  })

  describe('with team', function () {
    it('displays a message when the team has no apps', async function () {
      api
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/teams/test-team/apps')
        .reply(200, [])

      const {stderr, stdout} = await runCommand(['apps', '--team', 'test-team'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('There are no apps in team test-team.\n')
    })

    it('list all in a team', async function () {
      api
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/teams/test-team/apps')
        .reply(200, [teamApp1, teamApp2])

      const {stderr, stdout} = await runCommand(['apps', '--team', 'test-team'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== Apps in team test-team\n\n⬢ team-app-1\n⬢ team-app-2\n')
    })
  })

  describe('with space', function () {
    it('displays a message when the space has no apps', async function () {
      api
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/spaces/test-space')
        .reply(200, {team: {name: 'test-team'}})
        .get('/teams/test-team/apps')
        .reply(200, [])

      const {stderr, stdout} = await runCommand(['apps', '--space', 'test-space'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('There are no apps in space ⬡ test-space.\n')
    })

    it('lists only apps in spaces by name', async function () {
      api
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/spaces/test-space')
        .reply(200, {team: {name: 'test-team'}})
        .get('/teams/test-team/apps')
        .reply(200, [teamSpaceApp1, teamSpaceApp2, teamApp1])

      const {stderr, stdout} = await runCommand(['apps', '--space', 'test-space'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== Apps in space ⬡ test-space\n\n⬢ space-app-1\n⬢ space-app-2\n')
    })

    it('lists only internal apps in spaces by name', async function () {
      api
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/spaces/test-space')
        .reply(200, {team: {name: 'test-team'}})
        .get('/teams/test-team/apps')
        .reply(200, [teamSpaceApp1, teamSpaceApp2, teamApp1, teamSpaceInternalApp])

      const {stderr, stdout} = await runCommand(['apps', '--space', 'test-space', '--internal-routing'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== Apps in space ⬡ test-space\n\n⬢ space-internal-app [internal]\n')
    })
  })
})
