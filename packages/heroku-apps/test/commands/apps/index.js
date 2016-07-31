'use strict'
/* globals describe beforeEach afterEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const expect = require('chai').expect
const apps = require('../../../commands/apps/index.js')[0]

let example = {
  name: 'example',
  owner: {email: 'foo@bar.com'},
  region: {name: 'us'}
}

let euApp = {
  name: 'example-eu',
  owner: {email: 'foo@bar.com'},
  region: {name: 'eu'}
}

let collabApp = {
  name: 'collab-app',
  owner: {email: 'someone-else@bar.com'}
}

let orgApp1 = {
  name: 'org-app-1',
  owner: {email: 'test-org@herokumanager.com'}
}

let orgApp2 = {
  name: 'org-app-2',
  owner: {email: 'test-org@herokumanager.com'}
}

let orgSpaceApp1 = {
  name: 'space-app-1',
  owner: {email: 'test-org@herokumanager.com'},
  space: {id: 'test-space-id', name: 'test-space'}
}

let orgSpaceApp2 = {
  name: 'space-app-2',
  owner: {email: 'test-org@herokumanager.com'},
  space: {id: 'test-space-id', name: 'test-space'}
}

function stubApps (apps) {
  return nock('https://api.heroku.com')
    .get('/apps')
    .reply(200, apps)
}

function stubOrgApps (org, apps) {
  return nock('https://api.heroku.com')
    .get(`/organizations/${org}/apps`)
    .reply(200, apps)
}

describe('heroku apps:list', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()

    nock('https://api.heroku.com')
      .get('/account')
      .reply(200, {email: 'foo@bar.com'})
  })
  afterEach(() => nock.cleanAll())

  describe('with no args', function () {
    it('displays a message when the user has no apps', function () {
      let mock = stubApps([])
      return apps.run({flags: {}, args: {}}).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal('You have no apps.\n')
      })
    })

    it('list all user and collab apps omitting org apps', function () {
      let mock = stubApps([example, collabApp, orgApp1])
      return apps.run({flags: {}, args: {}}).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(
          `=== foo@bar.com Apps
example

=== Collaborated Apps
collab-app  someone-else@bar.com
`)
      })
    })

    it('shows as json', function () {
      let mock = stubApps([example, collabApp, orgApp1])
      return apps.run({flags: {json: true}, args: {}}).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(JSON.parse(cli.stdout)[0].name).to.equal('collab-app')
      })
    })

    it('shows region if not us', function () {
      let mock = stubApps([example, euApp])
      return apps.run({flags: {}, args: {}}).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(`=== foo@bar.com Apps
example
example-eu (eu)

`)
      })
    })
  })

  describe('with org', function () {
    it('displays a message when the org has no apps', function () {
      let mock = stubOrgApps('test-org', [])
      return apps.run({org: 'test-org', flags: {}, args: {}}).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(`There are no apps in organization test-org.
`)
      })
    })

    it('list all in an organization', function () {
      let mock = stubOrgApps('test-org', [orgApp1, orgApp2])
      return apps.run({org: 'test-org', flags: {}, args: {}}).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(
          `=== Apps in organization test-org
org-app-1
org-app-2

`)
      })
    })
  })

  describe('with space', function () {
    beforeEach(function () {
      return nock('https://api.heroku.com')
        .get('/spaces/test-space')
        .reply(200, {organization: {name: 'test-org'}})
    })

    it('displays a message when the space has no apps', function () {
      let mock = stubOrgApps('test-org', [])
      return apps.run({flags: {space: 'test-space'}, args: {}}).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(`There are no apps in space test-space.
`)
      })
    })

    it('lists only apps in spaces by name', function () {
      let mock = stubOrgApps('test-org', [orgSpaceApp1, orgSpaceApp2, orgApp1])
      return apps.run({flags: {space: 'test-space'}, args: {}}).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(
          `=== Apps in space test-space
space-app-1
space-app-2

`
        )
      })
    })
  })
})
