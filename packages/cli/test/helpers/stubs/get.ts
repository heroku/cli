'use strict'
import * as nock from 'nock'

export function apps() {
  return nock('https://api.heroku.com:443')
    .get('/apps')
    .reply(200, [
      {name: 'my-team-app', owner: {email: 'team@herokumanager.com'}},
      {name: 'myapp', owner: {email: 'foo@foo.com'}},
    ])
}

export function appCollaborators(collaborators =
[{user: {email: 'raulb@heroku.com'}, role: 'owner'},
  {user: {email: 'jeff@heroku.com'}, role: 'collaborator'}]) {
  return nock('https://api.heroku.com:443')
    .get('/apps/myapp/collaborators')
    .reply(200, collaborators)
}

export function appPermissions() {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3'},
  })
    .get('/teams/permissions')
    .reply(200, [
      {name: 'deploy'},
      {name: 'manage'},
      {name: 'operate'},
      {name: 'view'},
    ])
}

export function teams(teams = [
  {name: 'enterprise a', role: 'collaborator', type: 'enterprise'},
  {name: 'team a', role: 'collaborator', type: 'team'},
  {name: 'enterprise b', role: 'admin', type: 'enterprise'},
  {name: 'team b', role: 'admin', type: 'team'},
]) {
  return nock('https://api.heroku.com:443')
    .get('/teams')
    .reply(200, teams)
}

export function teamApp(locked = false) {
  return nock('https://api.heroku.com:443')
    .get('/apps/myapp')
    .reply(200, {
      name: 'myapp',
      owner: {email: 'myteam@herokumanager.com'},
      locked: locked,
    })
}

export function teamAppCollaboratorsWithPermissions() {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3'},
  })
    .get('/apps/myapp/collaborators')
    .reply(200, [
      {permissions: [],
        role: 'owner',
        user: {email: 'myteam@herokumanager.com'},
      },
      {
        permissions: [{name: 'deploy'}, {name: 'view'}],
        role: 'member',
        user: {email: 'bob@heroku.com'},
      },
    ])
}

export function teamFeatures(features: any) {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3'},
  })
    .get('/teams/myteam/features')
    .reply(200, features)
}

export function teamInfo(type = 'enterprise') {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3'},
  })
    .get('/teams/myteam')
    .reply(200, {
      name: 'myteam',
      role: 'admin',
      type: type,
    })
}

export function teamInvites(invites = [
  {
    invited_by: {email: 'raulb@heroku.com'},
    role: 'admin',
    user: {email: 'invited-user@mail.com'},
  },
]) {
  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3.team-invitations'},
  })
    .get('/teams/myteam/invitations')
    .reply(200, invites)
}

export function teamMembers(members = [
  {
    email: 'raulb@heroku.com',
    role: 'admin',
    user: {email: 'raulb@heroku.com'},
  },
  {
    email: 'bob@heroku.com',
    role: 'viewer',
    user: {email: 'bob@heroku.com'},
  },
  {
    email: 'peter@heroku.com',
    role: 'collaborator',
    user: {email: 'peter@heroku.com'},
  },
]) {
  return nock('https://api.heroku.com:443')
    .get('/teams/myteam/members')
    .reply(200, members)
}

export function personalApp() {
  return nock('https://api.heroku.com:443')
    .get('/apps/myapp')
    .reply(200, {
      name: 'myapp',
      owner: {email: 'raulb@heroku.com'},
    })
}

export function userAccount(email = 'raulb@heroku.com') {
  return nock('https://api.heroku.com:443')
    .get('/account')
    .reply(200, {email})
}

export function userFeatureFlags(features: any) {
  return nock('https://api.heroku.com:443')
    .get('/account/features')
    .reply(200, features)
}

export function variableSizeTeamInvites(teamSize: number) {
  teamSize = (typeof (teamSize) === 'undefined') ? 1 : teamSize
  const invites = []
  for (let i = 0; i < teamSize; i++) {
    invites.push({
      role: 'member', user: {email: `invited-user-${i}@mail.com`},
    })
  }

  return nock('https://api.heroku.com:443', {
    reqheaders: {Accept: 'application/vnd.heroku+json; version=3.team-invitations'},
  })
    .get('/teams/myteam/invitations')
    .reply(200, invites)
}

export function variableSizeTeamMembers(teamSize: number) {
  teamSize = (typeof (teamSize) === 'undefined') ? 1 : teamSize
  const teamMembers = []
  for (let i = 0; i < teamSize; i++) {
    teamMembers.push({
      email: `test${i}@heroku.com`,
      role: 'admin',
      user: {email: `test${i}@heroku.com`},
    })
  }

  return nock('https://api.heroku.com:443')
    .get('/teams/myteam/members')
    .reply(200, teamMembers)
}
