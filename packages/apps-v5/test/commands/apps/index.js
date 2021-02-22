'use strict'
/* globals describe beforeEach afterEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const expect = require('chai').expect
const apps = require('../../../src/commands/apps/index.js')[0]

let example = {
  name: 'example',
  owner: { email: 'foo@bar.com' },
  region: { name: 'us' }
}

let lockedApp = {
  name: 'locked-app',
  owner: { email: 'foo@bar.com' },
  region: { name: 'us' },
  locked: true
}

let internalApp = {
  name: 'internal-app',
  owner: { email: 'foo@bar.com' },
  region: { name: 'us' },
  space: { id: 'test-space-id', name: 'test-space' },
  internal_routing: true
}

let internalLockedApp = {
  name: 'internal-app',
  owner: { email: 'foo@bar.com' },
  region: { name: 'us' },
  space: { id: 'test-space-id', name: 'test-space' },
  internal_routing: true,
  locked: true
}

let euApp = {
  name: 'example-eu',
  owner: { email: 'foo@bar.com' },
  region: { name: 'eu' }
}

let collabApp = {
  name: 'collab-app',
  owner: { email: 'someone-else@bar.com' }
}

let teamApp1 = {
  name: 'team-app-1',
  owner: { email: 'test-team@herokumanager.com' }
}

let teamApp2 = {
  name: 'team-app-2',
  owner: { email: 'test-team@herokumanager.com' }
}

let teamSpaceApp1 = {
  name: 'space-app-1',
  owner: { email: 'test-team@herokumanager.com' },
  space: { id: 'test-space-id', name: 'test-space' }
}

let teamSpaceApp2 = {
  name: 'space-app-2',
  owner: { email: 'test-team@herokumanager.com' },
  space: { id: 'test-space-id', name: 'test-space' }
}

let teamSpaceInternalApp = {
  name: 'space-internal-app',
  owner: { email: 'test-team@herokumanager.com' },
  space: { id: 'test-space-id', name: 'test-space' },
  internal_routing: true
}

function stubApps (apps) {
  return nock('https://api.heroku.com')
    .get('/apps')
    .reply(200, apps)
}

function stubUserApps (apps) {
  return nock('https://api.heroku.com')
    .get('/users/~/apps')
    .reply(200, apps)
}

function stubteamApps (team, apps) {
  return nock('https://api.heroku.com')
    .get(`/teams/${team}/apps`)
    .reply(200, apps)
}

describe('heroku apps:list', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()

    nock('https://api.heroku.com')
      .get('/account')
      .reply(200, { email: 'foo@bar.com' })
  })
  afterEach(() => nock.cleanAll())

  describe('with no args', function () {
    it('displays a message when the user has no apps', async function() {
      let mock = stubUserApps([])
      await apps.run({ flags: {}, args: {} })
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal('You have no apps.\n')
    })

    it('list all user apps', async function() {
      let mock = stubUserApps([example, collabApp])
      await apps.run({ flags: {}, args: {} })
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
        `=== foo@bar.com Apps
example

=== Collaborated Apps
collab-app  someone-else@bar.com
`)
    })

    it('lists all apps', async function() {
      let mock = stubApps([example, collabApp, teamApp1])
      await apps.run({ flags: { all: true }, args: {} })
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
        `=== foo@bar.com Apps
example

=== Collaborated Apps
collab-app  someone-else@bar.com
team-app-1  test-team@herokumanager.com
`)
    })

    it('shows as json', async function() {
      let mock = stubUserApps([example, collabApp])
      await apps.run({ flags: { json: true }, args: {} })
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(JSON.parse(cli.stdout)[0].name).to.equal('collab-app')
    })

    it('shows region if not us', async function() {
      let mock = stubUserApps([example, euApp])
      await apps.run({ flags: {}, args: {} })
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(`=== foo@bar.com Apps
example
example-eu (eu)

`)
    })

    it('shows locked app', async function() {
      let mock = stubUserApps([example, euApp, lockedApp])
      await apps.run({ flags: {}, args: {} })
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(`=== foo@bar.com Apps
example
example-eu (eu)
locked-app [locked]

`)
    })

    it('shows locked eu app', async function() {
      let euLockedApp = Object.assign(lockedApp, { region: { name: 'eu' } })
      let mock = stubUserApps([example, euApp, euLockedApp])
      await apps.run({ flags: {}, args: {} })
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(`=== foo@bar.com Apps
example
example-eu (eu)
locked-app [locked] (eu)

`)
    })

    it('shows internal app', async function() {
      let mock = stubUserApps([example, euApp, internalApp])
      await apps.run({ flags: {}, args: {} })
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(`=== foo@bar.com Apps
example
example-eu (eu)
internal-app [internal]

`)
    })

    it('shows internal locked app', async function() {
      let mock = stubUserApps([example, euApp, internalLockedApp])
      await apps.run({ flags: {}, args: {} })
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(`=== foo@bar.com Apps
example
example-eu (eu)
internal-app [internal/locked]

`)
    })

    it('shows internal eu app', async function() {
      let euInternalApp = Object.assign(internalApp, { region: { name: 'eu' } })
      let mock = stubUserApps([example, euApp, euInternalApp])
      await apps.run({ flags: {}, args: {} })
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(`=== foo@bar.com Apps
example
example-eu (eu)
internal-app [internal] (eu)

`)
    })

    it('shows internal locked eu app', async function() {
      let euInternalLockedApp = Object.assign(internalLockedApp, { region: { name: 'eu' } })
      let mock = stubUserApps([example, euApp, euInternalLockedApp])
      await apps.run({ flags: {}, args: {} })
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(`=== foo@bar.com Apps
example
example-eu (eu)
internal-app [internal/locked] (eu)

`)
    })
  })

  describe('with team', function () {
    it('is configured for an optional team/org flag', function () {
      expect(apps).to.have.own.property('wantsOrg', true)
    })

    it('displays a message when the team has no apps', async function() {
      let mock = stubteamApps('test-team', [])
      await apps.run({ flags: { team: 'test-team' }, args: {} })
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(`There are no apps in team test-team.
`)
    })

    it('list all in a team', async function() {
      let mock = stubteamApps('test-team', [teamApp1, teamApp2])
      await apps.run({ flags: { team: 'test-team' }, args: {} })
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
        `=== Apps in team test-team
team-app-1
team-app-2

`)
    })
  })

  describe('with team', function () {
    it('displays a message when the team has no apps', async function() {
      let mock = stubteamApps('test-team', [])
      await apps.run({ flags: { team: 'test-team' }, args: {} })
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(`There are no apps in team test-team.
`)
    })

    it('list all in an team', async function() {
      let mock = stubteamApps('test-team', [teamApp1, teamApp2])
      await apps.run({ flags: { team: 'test-team' }, args: {} })
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
        `=== Apps in team test-team
team-app-1
team-app-2

`)
    })
  })

  describe('with space', function () {
    beforeEach(function () {
      return nock('https://api.heroku.com')
        .get('/spaces/test-space')
        .reply(200, { team: { name: 'test-team' } })
    })

    it('displays a message when the space has no apps', async function() {
      let mock = stubteamApps('test-team', [])
      await apps.run({ flags: { space: 'test-space' }, args: {} })
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(`There are no apps in space test-space.
`)
    })

    it('lists only apps in spaces by name', async function() {
      let mock = stubteamApps('test-team', [teamSpaceApp1, teamSpaceApp2, teamApp1])
      await apps.run({ flags: { space: 'test-space' }, args: {} })
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
        `=== Apps in space test-space
space-app-1
space-app-2

`
      )
    })

    it('lists only internal apps in spaces by name', async function() {
      let mock = stubteamApps('test-team', [teamSpaceApp1, teamSpaceApp2, teamApp1, teamSpaceInternalApp])
      await apps.run({ flags: { space: 'test-space', 'internal-routing': true }, args: {} })
      mock.done()
      expect(cli.stderr).to.equal('')
      expect(cli.stdout).to.equal(
        `=== Apps in space test-space
space-internal-app [internal]

`
      )
    })
  })
})
