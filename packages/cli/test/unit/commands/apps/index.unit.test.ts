import {expect, test} from '@oclif/test'

let example = {
  name: 'example',
  owner: {email: 'foo@bar.com'},
  region: {name: 'us'},
}

let lockedApp = {
  name: 'locked-app',
  owner: {email: 'foo@bar.com'},
  region: {name: 'us'},
  locked: true,
}

let internalApp = {
  name: 'internal-app',
  owner: {email: 'foo@bar.com'},
  region: {name: 'us'},
  space: {id: 'test-space-id', name: 'test-space'},
  internal_routing: true,
}

let internalLockedApp = {
  name: 'internal-app',
  owner: {email: 'foo@bar.com'},
  region: {name: 'us'},
  space: {id: 'test-space-id', name: 'test-space'},
  internal_routing: true,
  locked: true,
}

let euApp = {
  name: 'example-eu',
  owner: {email: 'foo@bar.com'},
  region: {name: 'eu'},
}

let collabApp = {
  name: 'collab-app',
  owner: {email: 'someone-else@bar.com'},
}

let teamApp1 = {
  name: 'team-app-1',
  owner: {email: 'test-team@herokumanager.com'},
}

let teamApp2 = {
  name: 'team-app-2',
  owner: {email: 'test-team@herokumanager.com'},
}

let teamSpaceApp1 = {
  name: 'space-app-1',
  owner: {email: 'test-team@herokumanager.com'},
  space: {id: 'test-space-id', name: 'test-space'},
}

let teamSpaceApp2 = {
  name: 'space-app-2',
  owner: {email: 'test-team@herokumanager.com'},
  space: {id: 'test-space-id', name: 'test-space'},
}

let teamSpaceInternalApp = {
  name: 'space-internal-app',
  owner: {email: 'test-team@herokumanager.com'},
  space: {id: 'test-space-id', name: 'test-space'},
  internal_routing: true,
}

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
  })
})
