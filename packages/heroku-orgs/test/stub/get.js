'use strict'

const nock = require('nock')

function apps () {
  return nock('https://api.heroku.com:443')
    .get('/apps')
    .reply(200, [
      { name: 'my-team-app', owner: { email: 'team@herokumanager.com' } },
      { name: 'my-org-app', owner: { email: 'organization@herokumanager.com' } },
      { name: 'myapp', owner: { email: 'foo@foo.com' } }
    ])
}

function appCollaborators () {
  return nock('https://api.heroku.com:443')
    .get('/apps/myapp/collaborators')
    .reply(200, [
      {user: {email: 'raulb@heroku.com'}, role: 'owner'},
      {user: {email: 'jeff@heroku.com'}, role: 'collaborator'}
    ])
}

function appPermissions () {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3.org-privileges'}
  })
    .get('/organizations/privileges')
    .reply(200, [
      { name: 'deploy' },
      { name: 'manage' },
      { name: 'operate' },
      { name: 'view' }
    ])
}

function orgApp (locked = false) {
  return nock('https://api.heroku.com:443')
    .get('/apps/myapp')
    .reply(200, {
      name: 'myapp',
      owner: { email: 'myorg@herokumanager.com' },
      locked: locked
    })
}

function orgAppCollaborators () {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3.org-privileges'}
  })
    .get('/organizations/apps/myapp/collaborators')
    .reply(200, [
      {
        role: 'owner',
        user: { email: 'myorg@herokumanager.com' }
      },
      {
        role: 'collaborator',
        user: { email: 'bob@heroku.com' }
      },
      {
        role: 'admin',
        user: { email: 'raulb@heroku.com' }
      }
    ])
}

function orgAppCollaboratorsWithPermissions () {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3.org-privileges'}
  })
    .get('/organizations/apps/myapp/collaborators')
    .reply(200, [
      { permissions: [],
        role: 'owner',
        user: { email: 'myorg@herokumanager.com' }
      },
      {
        permissions: [ { name: 'deploy' }, { name: 'view' } ],
        role: 'member',
        user: { email: 'bob@heroku.com' }
      }
    ])
}

function orgFlags (flags) {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=2'}
  })
    .get('/v1/organization/myorg')
    .reply(200, {
      flags: flags
    })
}

function orgMembers () {
  return nock('https://api.heroku.com:443')
    .get('/organizations/myorg/members')
    .reply(200, [
      {
        email: 'raulb@heroku.com', role: 'admin',
        user: { email: 'raulb@heroku.com' }
      },
      {
        email: 'bob@heroku.com', role: 'viewer',
        user: { email: 'bob@heroku.com' }
      },
      {
        email: 'peter@heroku.com', role: 'collaborator',
        user: { email: 'peter@heroku.com' }
      }
    ])
}

function variableSizeOrgMembers (orgSize) {
  orgSize = (typeof (orgSize) === 'undefined') ? 1 : orgSize
  let orgMembers = []
  for (let i = 0; i < orgSize; i++) {
    orgMembers.push({email: `test${i}@heroku.com`, role: 'admin',
    user: { email: `test${i}@heroku.com` }})
  }
  return nock('https://api.heroku.com:443')
    .get('/organizations/myorg/members')
    .reply(200, orgMembers)
}

function personalApp () {
  return nock('https://api.heroku.com:443')
    .get('/apps/myapp')
    .reply(200, {
      name: 'myapp',
      owner: { email: 'raulb@heroku.com' }
    })
}

function userFeatureFlags (flags) {
  return nock('https://api.heroku.com:443')
    .get('/account/features')
    .reply(200, flags)
}

module.exports = {
  apps: apps,
  appCollaborators: appCollaborators,
  appPermissions: appPermissions,
  orgApp: orgApp,
  orgAppCollaborators: orgAppCollaborators,
  orgAppCollaboratorsWithPermissions: orgAppCollaboratorsWithPermissions,
  orgFlags: orgFlags,
  orgMembers: orgMembers,
  personalApp: personalApp,
  userFeatureFlags: userFeatureFlags,
  variableSizeOrgMembers: variableSizeOrgMembers
}
