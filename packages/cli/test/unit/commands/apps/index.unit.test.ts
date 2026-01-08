import {expect} from 'chai'
import {runCommand} from '@oclif/test'
import nock from 'nock'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

const example = {
  name: 'example',
  owner: {email: 'foo@bar.com'},
  region: {name: 'us'},
}

const lockedApp = {
  name: 'locked-app',
  owner: {email: 'foo@bar.com'},
  region: {name: 'us'},
  locked: true,
}

const internalApp = {
  name: 'internal-app',
  owner: {email: 'foo@bar.com'},
  region: {name: 'us'},
  space: {id: 'test-space-id', name: 'test-space'},
  internal_routing: true,
}

const internalLockedApp = {
  name: 'internal-app',
  owner: {email: 'foo@bar.com'},
  region: {name: 'us'},
  space: {id: 'test-space-id', name: 'test-space'},
  internal_routing: true,
  locked: true,
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
  name: 'space-internal-app',
  owner: {email: 'test-team@herokumanager.com'},
  space: {id: 'test-space-id', name: 'test-space'},
  internal_routing: true,
}

let euLockedApp = {}
let euInternalApp = {}
let euInternalLockedApp = {}

describe('apps', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  describe('with no args', function () {
    it('displays a message when the user has no apps', async function () {
      nock('https://api.heroku.com:443')
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/users/~/apps')
        .reply(200, [])

      const {stdout, stderr} = await runCommand(['apps'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('You have no apps.\n')
    })

    it('list all user apps', async function () {
      nock('https://api.heroku.com:443')
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/users/~/apps')
        .reply(200, [example, collabApp])

      const {stdout, stderr} = await runCommand(['apps'])

      expect(stderr).to.equal('')
      const actual = removeAllWhitespace(stdout)
      const expectedPersonalApps = removeAllWhitespace(`
          === foo@bar.com Apps
          example`)
      const expectedCollaboratedAppsHeader = removeAllWhitespace('Collaborated Apps')
      const expectedCollaboratedApps = removeAllWhitespace('collab-app someone-else@bar.com')
      expect(actual).to.include(expectedPersonalApps)
      expect(actual).to.include(expectedCollaboratedAppsHeader)
      expect(actual).to.include(expectedCollaboratedApps)
    })

    it('lists all apps', async function () {
      nock('https://api.heroku.com:443')
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/apps')
        .reply(200, [example, collabApp, teamApp1])

      const {stdout, stderr} = await runCommand(['apps', '--all'])

      expect(stderr).to.equal('')
      const actual = removeAllWhitespace(stdout)
      const expectedPersonalApps = removeAllWhitespace(`
          === foo@bar.com Apps
          example`)
      const expectedCollaboratedAppsHeader = removeAllWhitespace('Collaborated Apps')
      const expectedCollaboratedApps = removeAllWhitespace('collab-app someone-else@bar.com')
      expect(actual).to.include(expectedPersonalApps)
      expect(actual).to.include(expectedCollaboratedAppsHeader)
      expect(actual).to.include(expectedCollaboratedApps)
    })

    it('shows as json', async function () {
      nock('https://api.heroku.com:443')
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/users/~/apps')
        .reply(200, [example, collabApp])

      const {stdout, stderr} = await runCommand(['apps', '--json'])

      expect(stderr).to.equal('')
      expect(JSON.parse(stdout)[0].name).to.equal('collab-app')
    })

    it('shows region if not us', async function () {
      nock('https://api.heroku.com:443')
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/users/~/apps')
        .reply(200, [example, euApp])

      const {stdout, stderr} = await runCommand(['apps'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== foo@bar.com Apps\n\nexample\nexample-eu (eu)\n')
    })

    it('shows locked app', async function () {
      nock('https://api.heroku.com:443')
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/users/~/apps')
        .reply(200, [example, euApp, lockedApp])

      const {stdout, stderr} = await runCommand(['apps'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== foo@bar.com Apps\n\nexample\nexample-eu (eu)\nlocked-app [locked]\n')
    })

    it('shows locked eu app', async function () {
      euLockedApp = Object.assign(lockedApp, {region: {name: 'eu'}})

      nock('https://api.heroku.com:443')
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/users/~/apps')
        .reply(200, [example, euApp, euLockedApp])

      const {stdout, stderr} = await runCommand(['apps'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== foo@bar.com Apps\n\nexample\nexample-eu (eu)\nlocked-app [locked] (eu)\n')
    })

    it('shows internal app', async function () {
      nock('https://api.heroku.com:443')
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/users/~/apps')
        .reply(200, [example, euApp, internalApp])

      const {stdout, stderr} = await runCommand(['apps'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== foo@bar.com Apps\n\nexample\nexample-eu (eu)\ninternal-app [internal]\n')
    })

    it('shows internal locked app', async function () {
      nock('https://api.heroku.com:443')
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/users/~/apps')
        .reply(200, [example, euApp, internalLockedApp])

      const {stdout, stderr} = await runCommand(['apps'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== foo@bar.com Apps\n\nexample\nexample-eu (eu)\ninternal-app [internal/locked]\n')
    })

    it('shows internal eu app', async function () {
      euInternalApp = Object.assign(internalApp, {region: {name: 'eu'}})

      nock('https://api.heroku.com:443')
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/users/~/apps')
        .reply(200, [example, euApp, euInternalApp])

      const {stdout, stderr} = await runCommand(['apps'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== foo@bar.com Apps\n\nexample\nexample-eu (eu)\ninternal-app [internal] (eu)\n')
    })

    it('shows internal locked eu app', async function () {
      euInternalLockedApp = Object.assign(internalLockedApp, {region: {name: 'eu'}})

      nock('https://api.heroku.com:443')
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/users/~/apps')
        .reply(200, [example, euApp, euInternalLockedApp])

      const {stdout, stderr} = await runCommand(['apps'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== foo@bar.com Apps\n\nexample\nexample-eu (eu)\ninternal-app [internal/locked] (eu)\n')
    })
  })

  describe('with team', function () {
    it('displays a message when the team has no apps', async function () {
      nock('https://api.heroku.com:443')
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/teams/test-team/apps')
        .reply(200, [])

      const {stdout, stderr} = await runCommand(['apps', '--team', 'test-team'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('There are no apps in team test-team.\n')
    })

    it('list all in a team', async function () {
      nock('https://api.heroku.com:443')
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/teams/test-team/apps')
        .reply(200, [teamApp1, teamApp2])

      const {stdout, stderr} = await runCommand(['apps', '--team', 'test-team'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== Apps in team test-team\n\nteam-app-1\nteam-app-2\n')
    })
  })

  describe('with space', function () {
    it('displays a message when the space has no apps', async function () {
      nock('https://api.heroku.com:443')
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/spaces/test-space')
        .reply(200, {team: {name: 'test-team'}})
        .get('/teams/test-team/apps')
        .reply(200, [])

      const {stdout, stderr} = await runCommand(['apps', '--space', 'test-space'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('There are no apps in space test-space.\n')
    })

    it('lists only apps in spaces by name', async function () {
      nock('https://api.heroku.com:443')
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/spaces/test-space')
        .reply(200, {team: {name: 'test-team'}})
        .get('/teams/test-team/apps')
        .reply(200, [teamSpaceApp1, teamSpaceApp2, teamApp1])

      const {stdout, stderr} = await runCommand(['apps', '--space', 'test-space'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== Apps in space test-space\n\nspace-app-1\nspace-app-2\n')
    })

    it('lists only internal apps in spaces by name', async function () {
      nock('https://api.heroku.com:443')
        .get('/account')
        .reply(200, {email: 'foo@bar.com'})
        .get('/spaces/test-space')
        .reply(200, {team: {name: 'test-team'}})
        .get('/teams/test-team/apps')
        .reply(200, [teamSpaceApp1, teamSpaceApp2, teamApp1, teamSpaceInternalApp])

      const {stdout, stderr} = await runCommand(['apps', '--space', 'test-space', '--internal-routing'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal('=== Apps in space test-space\n\nspace-internal-app [internal]\n')
    })
  })
})
