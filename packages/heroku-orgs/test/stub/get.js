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

function appCollaborators (collaborators =
  [{user: {email: 'raulb@heroku.com'}, role: 'owner'},
  {user: {email: 'jeff@heroku.com'}, role: 'collaborator'}]) {
  return nock('https://api.heroku.com:443')
    .get('/apps/myapp/collaborators')
    .reply(200, collaborators)
}

function appPermissions () {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3'}
  })
    .get('/organizations/permissions')
    .reply(200, [
      { name: 'deploy' },
      { name: 'manage' },
      { name: 'operate' },
      { name: 'view' }
    ])
}

function orgs (orgs = [
  {name: 'org a', role: 'collaborator'},
  {name: 'org b', role: 'admin'}
]) {
  return nock('https://api.heroku.com:443')
    .get('/organizations')
    .reply(200, orgs)
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

function orgAppCollaboratorsWithPermissions () {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3'}
  })
    .get('/apps/myapp/collaborators')
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

function orgFeatures (features) {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3'}
  })
    .get('/organizations/myorg/features')
    .reply(200, features)
}

function orgMembers (members = [
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
]) {
  return nock('https://api.heroku.com:443')
    .get('/organizations/myorg/members')
    .reply(200, members)
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

function userFeatureFlags (features) {
  return nock('https://api.heroku.com:443')
    .get('/account/features')
    .reply(200, features)
}

module.exports = {
  apps,
  appCollaborators,
  appPermissions,
  orgs,
  orgApp,
  orgAppCollaboratorsWithPermissions,
  orgFeatures,
  orgMembers,
  personalApp,
  userFeatureFlags,
  variableSizeOrgMembers
}
