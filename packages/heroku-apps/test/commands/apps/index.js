'use strict'
/* globals describe beforeEach afterEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const expect = require('chai').expect
const apps = require('../../../src/commands/apps/index.js')[0]

let example = {
  name: 'example',
  owner: {email: 'foo@bar.com'},
  region: {name: 'us'}
}

let lockedApp = {
  name: 'locked-app',
  owner: {email: 'foo@bar.com'},
  region: {name: 'us'},
  locked: true
}

let internalApp = {
  name: 'internal-app',
  owner: {email: 'foo@bar.com'},
  region: {name: 'us'},
  space: {id: 'test-space-id', name: 'test-space'},
  internal: true
}

let internalLockedApp = {
  name: 'internal-app',
  owner: {email: 'foo@bar.com'},
  region: {name: 'us'},
  space: {id: 'test-space-id', name: 'test-space'},
  internal: true,
  locked: true
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

let orgSpaceInternalApp = {
  name: 'space-internal-app',
  owner: {email: 'test-org@herokumanager.com'},
  space: {id: 'test-space-id', name: 'test-space'},
  internal: true
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
      let mock = stubUserApps([])
      return apps.run({flags: {}, args: {}}).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal('You have no apps.\n')
      })
    })

    it('list all user apps', function () {
      let mock = stubUserApps([example, collabApp])
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

    it('lists all apps', function () {
      let mock = stubApps([example, collabApp, orgApp1])
      return apps.run({flags: {all: true}, args: {}}).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(
          `=== foo@bar.com Apps
example

=== Collaborated Apps
collab-app  someone-else@bar.com
org-app-1   test-org@herokumanager.com
`)
      })
    })

    it('shows as json', function () {
      let mock = stubUserApps([example, collabApp])
      return apps.run({flags: {json: true}, args: {}}).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(JSON.parse(cli.stdout)[0].name).to.equal('collab-app')
      })
    })

    it('shows region if not us', function () {
      let mock = stubUserApps([example, euApp])
      return apps.run({flags: {}, args: {}}).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(`=== foo@bar.com Apps
example
example-eu (eu)

`)
      })
    })

    it('shows locked app', function () {
      let mock = stubUserApps([example, euApp, lockedApp])
      return apps.run({flags: {}, args: {}}).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(`=== foo@bar.com Apps
example
example-eu (eu)
locked-app [locked]

`)
      })
    })

    it('shows locked eu app', function () {
      let euLockedApp = Object.assign(lockedApp, {region: {name: 'eu'}})
      let mock = stubUserApps([example, euApp, euLockedApp])
      return apps.run({flags: {}, args: {}}).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(`=== foo@bar.com Apps
example
example-eu (eu)
locked-app [locked] (eu)

`)
      })
    })

    it('shows internal app', function () {
      let  mock = stubUserApps([example, euApp, internalApp])
      return apps.run({flags: {}, args: {}}).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(`=== foo@bar.com Apps
example
example-eu (eu)
internal-app [internal]

`)
      })
    })

    it('shows internal locked app', function () {
      let mock = stubUserApps([example, euApp, internalLockedApp])
      return apps.run({flags: {}, args: {}}).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(`=== foo@bar.com Apps
example
example-eu (eu)
internal-app [internal/locked]

`)
      })
    })

    it('shows internal eu app', function () {
      let euInternalApp = Object.assign(internalApp, {region: {name: 'eu'}})
      let mock = stubUserApps([example, euApp, euInternalApp])
      return apps.run({flags: {}, args: {}}).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(`=== foo@bar.com Apps
example
example-eu (eu)
internal-app [internal] (eu)

`)
      })
    })

    it('shows internal locked eu app', function () {
      let euInternalLockedApp = Object.assign(internalLockedApp, {region: {name: 'eu'}})
      let mock = stubUserApps([example, euApp, euInternalLockedApp])
      return apps.run({flags: {}, args: {}}).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(`=== foo@bar.com Apps
example
example-eu (eu)
internal-app [internal/locked] (eu)

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
        expect(cli.stdout).to.equal(`There are no apps in team test-org.
`)
      })
    })

    it('list all in an organization', function () {
      let mock = stubOrgApps('test-org', [orgApp1, orgApp2])
      return apps.run({org: 'test-org', flags: {}, args: {}}).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(
          `=== Apps in team test-org
org-app-1
org-app-2

`)
      })
    })
  })

  describe('with team', function () {
    it('displays a message when the team has no apps', function () {
      let mock = stubOrgApps('test-team', [])
      return apps.run({team: 'test-team', flags: {}, args: {}}).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(`There are no apps in team test-team.
`)
      })
    })

    it('list all in an team', function () {
      let mock = stubOrgApps('test-team', [orgApp1, orgApp2])
      return apps.run({team: 'test-team', flags: {}, args: {}}).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(
          `=== Apps in team test-team
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

    it('lists only internal apps in spaces by name', function () {
      let mock = stubOrgApps('test-org', [orgSpaceApp1, orgSpaceApp2, orgApp1, orgSpaceInternalApp])
      return apps.run({flags: {space: 'test-space', internal: true}, args: {}}).then(function () {
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
})
