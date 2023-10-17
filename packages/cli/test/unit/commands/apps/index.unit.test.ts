import {expect, test} from '@oclif/test'

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

describe('apps', () => {
  describe('with no args', () => {
    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com:443', api => {
        api.get('/account')
          .reply(200, {email: 'foo@bar.com'})

        api.get('/users/~/apps')
          .reply(200, [])
      })
      .command(['apps'])
      .it('displays a message when the user has no apps', ({stdout, stderr}) => {
        expect(stderr).to.equal('')
        expect(stdout).to.equal('You have no apps.\n')
      })

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com:443', api => {
        api.get('/account')
          .reply(200, {email: 'foo@bar.com'})

        api.get('/users/~/apps')
          .reply(200, [example, collabApp])
      })
      .command(['apps'])
      .it('list all user apps', ({stdout, stderr}) => {
        expect(stderr).to.equal('')
        expect(stdout).to.equal('=== foo@bar.com Apps\n\nexample\n=== Collaborated Apps\n\n collab-app someone-else@bar.com \n')
      })

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com:443', api => {
        api.get('/account')
          .reply(200, {email: 'foo@bar.com'})

        api.get('/apps')
          .reply(200, [example, collabApp, teamApp1])
      })
      .command(['apps', '--all'])
      .it('lists all apps', ({stdout, stderr}) => {
        expect(stderr).to.equal('')
        expect(stdout).to.equal('=== foo@bar.com Apps\n\nexample\n=== Collaborated Apps\n\n collab-app someone-else@bar.com        \n team-app-1 test-team@herokumanager.com \n')
      })

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com:443', api => {
        api.get('/account')
          .reply(200, {email: 'foo@bar.com'})

        api.get('/users/~/apps')
          .reply(200, [example, collabApp])
      })
      .command(['apps', '--json'])
      .it('shows as json', ({stdout, stderr}) => {
        expect(stderr).to.equal('')
        expect(JSON.parse(stdout)[0].name).to.equal('collab-app')
      })

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com:443', api => {
        api.get('/account')
          .reply(200, {email: 'foo@bar.com'})

        api.get('/users/~/apps')
          .reply(200, [example, euApp])
      })
      .command(['apps'])
      .it('shows region if not us', ({stdout, stderr}) => {
        expect(stderr).to.equal('')
        expect(stdout).to.equal('=== foo@bar.com Apps\n\nexample\nexample-eu (eu)\n')
      })

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com:443', api => {
        api.get('/account')
          .reply(200, {email: 'foo@bar.com'})

        api.get('/users/~/apps')
          .reply(200, [example, euApp, lockedApp])
      })
      .command(['apps'])
      .it('shows locked app', ({stdout, stderr}) => {
        expect(stderr).to.equal('')
        expect(stdout).to.equal('=== foo@bar.com Apps\n\nexample\nexample-eu (eu)\nlocked-app [locked]\n')
      })

    test
      .stdout()
      .stderr()
      .do(() => {
        euLockedApp = Object.assign(lockedApp, {region: {name: 'eu'}})
      })
      .nock('https://api.heroku.com:443', api => {
        api.get('/account')
          .reply(200, {email: 'foo@bar.com'})

        api.get('/users/~/apps')
          .reply(200, [example, euApp, euLockedApp])
      })
      .command(['apps'])
      .it('shows locked eu app', ({stdout, stderr}) => {
        expect(stderr).to.equal('')
        expect(stdout).to.equal('=== foo@bar.com Apps\n\nexample\nexample-eu (eu)\nlocked-app [locked] (eu)\n')
      })

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com:443', api => {
        api.get('/account')
          .reply(200, {email: 'foo@bar.com'})

        api.get('/users/~/apps')
          .reply(200, [example, euApp, internalApp])
      })
      .command(['apps'])
      .it('shows internal app', ({stdout, stderr}) => {
        expect(stderr).to.equal('')
        expect(stdout).to.equal('=== foo@bar.com Apps\n\nexample\nexample-eu (eu)\ninternal-app [internal]\n')
      })

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com:443', api => {
        api.get('/account')
          .reply(200, {email: 'foo@bar.com'})

        api.get('/users/~/apps')
          .reply(200, [example, euApp, internalLockedApp])
      })
      .command(['apps'])
      .it('shows internal locked app', ({stdout, stderr}) => {
        expect(stderr).to.equal('')
        expect(stdout).to.equal('=== foo@bar.com Apps\n\nexample\nexample-eu (eu)\ninternal-app [internal/locked]\n')
      })

    test
      .stdout()
      .stderr()
      .do(() => {
        euInternalApp = Object.assign(internalApp, {region: {name: 'eu'}})
      })
      .nock('https://api.heroku.com:443', api => {
        api.get('/account')
          .reply(200, {email: 'foo@bar.com'})

        api.get('/users/~/apps')
          .reply(200, [example, euApp, euInternalApp])
      })
      .command(['apps'])
      .it('shows internal eu app', ({stdout, stderr}) => {
        expect(stderr).to.equal('')
        expect(stdout).to.equal('=== foo@bar.com Apps\n\nexample\nexample-eu (eu)\ninternal-app [internal] (eu)\n')
      })

    test
      .stdout()
      .stderr()
      .do(() => {
        euInternalLockedApp = Object.assign(internalLockedApp, {region: {name: 'eu'}})
      })
      .nock('https://api.heroku.com:443', api => {
        api.get('/account')
          .reply(200, {email: 'foo@bar.com'})

        api.get('/users/~/apps')
          .reply(200, [example, euApp, euInternalLockedApp])
      })
      .command(['apps'])
      .it('shows internal locked eu app', ({stdout, stderr}) => {
        expect(stderr).to.equal('')
        expect(stdout).to.equal('=== foo@bar.com Apps\n\nexample\nexample-eu (eu)\ninternal-app [internal/locked] (eu)\n')
      })
  })

  describe('with team', () => {
    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com:443', api => {
        api.get('/account')
          .reply(200, {email: 'foo@bar.com'})

        api.get('/teams/test-team/apps')
          .reply(200, [])
      })
      .command(['apps', '--team', 'test-team'])
      .it('displays a message when the team has no apps', ({stdout, stderr}) => {
        expect(stderr).to.equal('')
        expect(stdout).to.equal('There are no apps in team test-team.\n')
      })

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com:443', api => {
        api.get('/account')
          .reply(200, {email: 'foo@bar.com'})

        api.get('/teams/test-team/apps')
          .reply(200, [teamApp1, teamApp2])
      })
      .command(['apps', '--team', 'test-team'])
      .it('list all in a team', ({stdout, stderr}) => {
        expect(stderr).to.equal('')
        expect(stdout).to.equal('=== Apps in team test-team\n\nteam-app-1\nteam-app-2\n')
      })
  })

  describe('with space', () => {
    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com:443', api => {
        api.get('/account')
          .reply(200, {email: 'foo@bar.com'})

        api.get('/spaces/test-space')
          .reply(200, {team: {name: 'test-team'}})

        api.get('/teams/test-team/apps')
          .reply(200, [])
      })
      .command(['apps', '--space', 'test-space'])
      .it('displays a message when the space has no apps', ({stdout, stderr}) => {
        expect(stderr).to.equal('')
        expect(stdout).to.equal('There are no apps in space test-space.\n')
      })

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com:443', api => {
        api.get('/account')
          .reply(200, {email: 'foo@bar.com'})

        api.get('/spaces/test-space')
          .reply(200, {team: {name: 'test-team'}})

        api.get('/teams/test-team/apps')
          .reply(200, [teamSpaceApp1, teamSpaceApp2, teamApp1])
      })
      .command(['apps', '--space', 'test-space'])
      .it('lists only apps in spaces by name', ({stdout, stderr}) => {
        expect(stderr).to.equal('')
        expect(stdout).to.equal('=== Apps in space test-space\n\nspace-app-1\nspace-app-2\n')
      })

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com:443', api => {
        api.get('/account')
          .reply(200, {email: 'foo@bar.com'})

        api.get('/spaces/test-space')
          .reply(200, {team: {name: 'test-team'}})

        api.get('/teams/test-team/apps')
          .reply(200, [teamSpaceApp1, teamSpaceApp2, teamApp1, teamSpaceInternalApp])
      })
      .command(['apps', '--space', 'test-space', '--internal-routing'])
      .it('lists only internal apps in spaces by name', ({stdout, stderr}) => {
        expect(stderr).to.equal('')
        expect(stdout).to.equal('=== Apps in space test-space\n\nspace-internal-app [internal]\n')
      })
  })
})
